from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import tempfile

from emergent_storage import init_storage, put_object_from_file, get_object_stream, APP_NAME as STORAGE_APP
from security import sanitize_text, sanitize_short, SECURITY_HEADERS, CSP_REPORT_ONLY
from media_transcoder import (
    is_transcodable_image,
    negotiate_image_format,
    maybe_transcoded_bytes,
    transcode_video_h265_async,
    ffmpeg_available,
    MEDIA_CACHE_DIR,
)

# ------------------------------------------------------------------ config
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@caremanto.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Caremanto@2026')
EMERGENT_EMAIL_KEY = os.environ.get('EMERGENT_EMAIL_KEY', '')
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'Caremanto Solutions')
STUDIO_NOTIFICATION_EMAIL = os.environ.get('STUDIO_NOTIFICATION_EMAIL', 'info@caremanto.solutions')
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
JWT_ALG = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Caremanto Solutions API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caremanto")

# ------------------------------------------------------------------ helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user or user.get("role") != "admin":
            raise HTTPException(401, "Admin not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

# ------------------------------------------------------------------ models
CategoryLit = Literal["interiors", "restoration"]

class ProjectIn(BaseModel):
    title: str
    category: CategoryLit
    subcategory: str
    location: Optional[str] = ""
    year: Optional[str] = ""
    story: Optional[str] = ""
    cover_image: str
    images: List[str] = Field(default_factory=list)
    featured: bool = False
    is_sample: bool = False

class Project(ProjectIn):
    id: str
    created_at: str
    updated_at: str

class LeadIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    project_type: Optional[str] = ""      # legacy field, kept for older payloads
    service_type: Optional[str] = ""      # new — "interiors" | "restoration"
    pincode: Optional[str] = ""
    budget: Optional[str] = ""
    message: Optional[str] = ""

class Lead(LeadIn):
    id: str
    customer_uid: str = ""
    status: str = "new"
    created_at: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GalleryPhotoIn(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    practice: Optional[str] = "interiors"   # "interiors" | "restoration"
    category: str
    subcategory: Optional[str] = ""
    image: str
    is_sample: bool = False
    featured_home: bool = False             # scrolling home bento
    featured_portfolio: bool = False        # /works portfolio page
    is_cover: bool = False                  # cover card for its (category, subcategory)

class GalleryPhoto(GalleryPhotoIn):
    id: str
    created_at: str
    home_order: Optional[int] = None      # position on the homepage bento (admin-set)
    folder_order: Optional[int] = None    # position inside its folder (Smart Layout)

class TaxonomyIn(BaseModel):
    categories: List[str]
    subcategories: dict

class VideoIn(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    url: str                       # video file URL (uploaded) or embed URL
    poster: Optional[str] = ""     # thumbnail image URL
    featured_home: bool = False

class Video(VideoIn):
    id: str
    created_at: str

# ------------------------------------------------------------------ email
async def send_notification_email(subject: str, html: str, reply_to: Optional[str] = None):
    if not EMERGENT_EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY missing — skipping email")
        return None
    payload = {
        "to": [STUDIO_NOTIFICATION_EMAIL],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMERGENT_EMAIL_KEY},
                json=payload,
            )
        r.raise_for_status()
        return r.json().get("id")
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return None

def lead_email_html(lead: dict) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,serif;background:#0A0B0E;color:#F4F3ED;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#14151A;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="padding:32px 32px 8px;">
            <div style="font-size:11px;letter-spacing:3px;color:#C8A97E;text-transform:uppercase;">Caremanto Solutions</div>
            <h1 style="font-size:28px;margin:8px 0 24px;font-weight:400;">New Consultation Request</h1>
          </td></tr>
          <tr><td style="padding:0 32px 24px;color:#F4F3ED;">
            <p style="margin:0 0 6px;color:#A1A1AA;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Name</p>
            <p style="margin:0 0 18px;font-size:16px;">{lead['name']}</p>
            <p style="margin:0 0 6px;color:#A1A1AA;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Email</p>
            <p style="margin:0 0 18px;font-size:16px;">{lead['email']}</p>
            <p style="margin:0 0 6px;color:#A1A1AA;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Phone</p>
            <p style="margin:0 0 18px;font-size:16px;">{lead.get('phone') or '—'}</p>
            <p style="margin:0 0 6px;color:#A1A1AA;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Project Type</p>
            <p style="margin:0 0 18px;font-size:16px;">{lead['project_type']}</p>
            <p style="margin:0 0 6px;color:#A1A1AA;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Budget</p>
            <p style="margin:0 0 18px;font-size:16px;">{lead.get('budget') or '—'}</p>
            <p style="margin:0 0 6px;color:#A1A1AA;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Message</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">{lead['message']}</p>
          </td></tr>
          <tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.08);color:#A1A1AA;font-size:12px;">
            Received {lead['created_at']}
          </td></tr>
        </table>
      </td></tr>
    </table>
    """

# ------------------------------------------------------------------ routes: auth
@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, secure=False,
                        samesite="lax", max_age=8 * 3600, path="/")
    return {"id": user["id"], "email": email, "name": user.get("name"), "role": user.get("role"), "token": token}

@api.post("/auth/passless-login")
async def passless_login(response: Response):
    """Temporary password-free admin entry — signs in the seeded admin account.
    Intended for the studio's own quick access; can be removed once real auth flow is required.
    """
    user = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if not user:
        raise HTTPException(500, "Admin account not seeded")
    token = create_access_token(user["id"], user["email"])
    response.set_cookie("access_token", token, httponly=True, secure=False,
                        samesite="lax", max_age=8 * 3600, path="/")
    return {"id": user["id"], "email": user["email"], "name": user.get("name"), "role": user.get("role"), "token": token}

@api.post("/auth/logout")
async def logout(response: Response, _admin=Depends(get_current_admin)):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin

# ------------------------------------------------------------------ routes: projects (public read)
@api.get("/projects", response_model=List[Project])
async def list_projects(category: Optional[CategoryLit] = None):
    q: dict = {}
    if category:
        q["category"] = category
    docs = await db.projects.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.get("/projects/{pid}", response_model=Project)
async def get_project(pid: str):
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return doc

# ------------------------------------------------------------------ routes: projects (admin write)
@api.post("/admin/projects", response_model=Project)
async def create_project(body: ProjectIn, _admin=Depends(get_current_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {**body.model_dump(), "id": str(uuid.uuid4()), "created_at": now, "updated_at": now}
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/admin/projects/{pid}", response_model=Project)
async def update_project(pid: str, body: ProjectIn, _admin=Depends(get_current_admin)):
    now = datetime.now(timezone.utc).isoformat()
    update = {**body.model_dump(), "updated_at": now}
    res = await db.projects.find_one_and_update(
        {"id": pid}, {"$set": update},
        return_document=True, projection={"_id": 0},
    )
    if not res:
        raise HTTPException(404, "Not found")
    return res

@api.delete("/admin/projects/{pid}")
async def delete_project(pid: str, _admin=Depends(get_current_admin)):
    res = await db.projects.delete_one({"id": pid})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}

# ------------------------------------------------------------------ routes: leads
@api.post("/leads", response_model=Lead)
async def create_lead(body: LeadIn):
    now = datetime.now(timezone.utc).isoformat()
    # Generate a stable, brand-prefixed Customer UID (e.g. "CS-20260717-8F3A2C")
    seq = uuid.uuid4().hex[:6].upper()
    customer_uid = f"CS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{seq}"
    # ---- XSS hardening -------------------------------------------------
    # Every text field is stripped of HTML, control chars, and length-capped
    # before it ever hits the database. Emails are validated by Pydantic;
    # `EmailStr` already blocks anything unusual.
    payload = body.model_dump()
    payload["name"]         = sanitize_short(payload.get("name"), max_length=120)
    payload["phone"]        = sanitize_short(payload.get("phone"), max_length=32)
    payload["project_type"] = sanitize_short(payload.get("project_type"), max_length=64)
    payload["service_type"] = sanitize_short(payload.get("service_type"), max_length=64)
    payload["pincode"]      = sanitize_short(payload.get("pincode"), max_length=12)
    payload["budget"]       = sanitize_short(payload.get("budget"), max_length=64)
    payload["message"]      = sanitize_text(payload.get("message"), max_length=2000)
    if not payload["name"]:
        raise HTTPException(422, "Name is required.")
    doc = {
        **payload,
        "id": str(uuid.uuid4()),
        "customer_uid": customer_uid,
        "status": "new",
        "created_at": now,
    }
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    # fire-and-forget email
    try:
        await send_notification_email(
            subject=f"New consultation — {doc['name']} ({customer_uid})",
            html=lead_email_html(doc),
            reply_to=doc["email"],
        )
    except Exception as e:
        logger.error(f"lead email failure: {e}")
    return doc

@api.get("/admin/leads", response_model=List[Lead])
async def list_leads(_admin=Depends(get_current_admin)):
    docs = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api.patch("/admin/leads/{lid}")
async def update_lead(lid: str, status: str, _admin=Depends(get_current_admin)):
    res = await db.leads.update_one({"id": lid}, {"$set": {"status": status}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/admin/leads/{lid}")
async def delete_lead(lid: str, _admin=Depends(get_current_admin)):
    res = await db.leads.delete_one({"id": lid})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}

# ------------------------------------------------------------------ routes: gallery
DEFAULT_TAXONOMY = {
    "categories": ["RESIDENTIAL", "COMMERCIAL", "RESTORATION & RENOVATIONS"],
    "subcategories": {
        "RESIDENTIAL": ["Hall & Dining", "Bedrooms", "Bathrooms", "Kitchens", "Balcony / Dry Area / Temple"],
        "COMMERCIAL":  ["Office spaces", "Retail Design", "Hospitality"],
        "RESTORATION & RENOVATIONS": [],   # no sub-folders — direct photo grid
    },
}
# Legacy sub-name → new sub-name — applied once at startup so previously-seeded
# photos still resolve to a folder card in the restructured Gallery page.
SUBCATEGORY_ALIASES = {
    # v1 seed
    "Balcony - Dry Area": "Balcony / Dry Area / Temple",
    "Temple":             "Balcony / Dry Area / Temple",
    "Office Spaces":      "Office spaces",
    "Retail Design":      "Retail Design",
    "Kitchen":            "Kitchens",
    # v2 seed
    "Balcony & Dry area": "Balcony / Dry Area / Temple",
    "Offices":            "Office spaces",
    "Retail":             "Retail Design",
}

@api.get("/gallery/taxonomy")
async def get_taxonomy():
    doc = await db.settings.find_one({"key": "gallery_taxonomy"}, {"_id": 0})
    return (doc or {}).get("value") or DEFAULT_TAXONOMY

@api.put("/admin/gallery/taxonomy")
async def update_taxonomy(body: TaxonomyIn, _admin=Depends(get_current_admin)):
    value = {
        "categories": [s.strip() for s in body.categories if s and s.strip()],
        "subcategories": {
            k.strip(): [x.strip() for x in v if x and x.strip()]
            for k, v in (body.subcategories or {}).items()
            if k and k.strip()
        },
    }
    await db.settings.update_one(
        {"key": "gallery_taxonomy"},
        {"$set": {"key": "gallery_taxonomy", "value": value}},
        upsert=True,
    )
    return value

@api.get("/gallery", response_model=List[GalleryPhoto])
async def list_gallery(category: Optional[str] = None, subcategory: Optional[str] = None,
                       featured_home: Optional[bool] = None,
                       featured_portfolio: Optional[bool] = None,
                       is_cover: Optional[bool] = None):
    q: dict = {}
    if category:            q["category"] = category
    if subcategory:         q["subcategory"] = subcategory
    if featured_home is not None:      q["featured_home"] = featured_home
    if featured_portfolio is not None: q["featured_portfolio"] = featured_portfolio
    if is_cover is not None:           q["is_cover"] = is_cover
    docs = await db.gallery.find(q, {"_id": 0}).sort("created_at", -1).to_list(4000)
    return docs

# Home-page sequence: return only the featured_home photos, in `home_order`
# ascending (fallback to created_at). Keeps the public /home render + admin
# sequence editor in sync.
@api.get("/gallery/home-sequence")
async def home_sequence():
    docs = await db.gallery.find({"featured_home": True}, {"_id": 0}).to_list(500)
    # sort: home_order asc (null last), then created_at
    docs.sort(key=lambda d: (d.get("home_order") is None, d.get("home_order") or 0, d.get("created_at", "")))
    return docs

class HomeOrderIn(BaseModel):
    order: List[str]     # ordered list of photo ids

@api.put("/admin/gallery/home-sequence")
async def set_home_sequence(body: HomeOrderIn, _admin=Depends(get_current_admin)):
    """Persist the exact display order for photos featured on the home page."""
    for idx, pid in enumerate(body.order):
        await db.gallery.update_one({"id": pid}, {"$set": {"home_order": idx, "featured_home": True}})
    return {"ok": True, "count": len(body.order)}

class FolderOrderIn(BaseModel):
    order: List[str]     # ordered list of photo ids inside one folder

@api.put("/admin/gallery/folder-order")
async def set_folder_order(body: FolderOrderIn, _admin=Depends(get_current_admin)):
    """Persist the admin's Smart Grid Layout — a per-folder photo ordering."""
    for idx, pid in enumerate(body.order):
        await db.gallery.update_one({"id": pid}, {"$set": {"folder_order": idx}})
    return {"ok": True, "count": len(body.order)}

@api.post("/admin/gallery", response_model=GalleryPhoto)
async def create_photo(body: GalleryPhotoIn, _admin=Depends(get_current_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {**body.model_dump(), "id": str(uuid.uuid4()), "created_at": now}
    await db.gallery.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/admin/gallery/{pid}", response_model=GalleryPhoto)
async def update_photo(pid: str, body: GalleryPhotoIn, _admin=Depends(get_current_admin)):
    res = await db.gallery.find_one_and_update(
        {"id": pid}, {"$set": body.model_dump()},
        return_document=True, projection={"_id": 0},
    )
    if not res:
        raise HTTPException(404, "Not found")
    return res

@api.delete("/admin/gallery/{pid}")
async def delete_photo(pid: str, _admin=Depends(get_current_admin)):
    res = await db.gallery.delete_one({"id": pid})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}

# ------------------------------------------------------------------ videos
@api.get("/videos", response_model=List[Video])
async def list_videos():
    docs = await db.videos.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.post("/admin/videos", response_model=Video)
async def create_video(body: VideoIn, _admin=Depends(get_current_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {**body.model_dump(), "id": str(uuid.uuid4()), "created_at": now}
    await db.videos.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/admin/videos/{vid}", response_model=Video)
async def update_video(vid: str, body: VideoIn, _admin=Depends(get_current_admin)):
    res = await db.videos.find_one_and_update(
        {"id": vid}, {"$set": body.model_dump()},
        return_document=True, projection={"_id": 0},
    )
    if not res:
        raise HTTPException(404, "Not found")
    return res

@api.delete("/admin/videos/{vid}")
async def delete_video(vid: str, _admin=Depends(get_current_admin)):
    res = await db.videos.delete_one({"id": vid})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}

# ------------------------------------------------------------------ section covers
DEFAULT_MARQUEE = ["INTERIORS", "RESTORATION", "REDEFINING SPACES", "SERVICES"]
DEFAULT_COVERS = {
    "interiors_cover":   "https://lh3.googleusercontent.com/d/1F9U9UjI9CHuxR-AkUvJZQRrom_oF10pm=w1400",
    "restoration_cover": "https://lh3.googleusercontent.com/d/1tMuPICaLjYIn8smCG0cize45rzG9DKPo=w1400",
    "hero_extra":        [],
    "hero_images":       [],
    "hero_interval_seconds": 4.5,
    "marquee_items":     DEFAULT_MARQUEE,
}

class CoversIn(BaseModel):
    interiors_cover: Optional[str] = None
    restoration_cover: Optional[str] = None
    hero_extra: Optional[List[str]] = None
    hero_images: Optional[List[str]] = None
    hero_interval_seconds: Optional[float] = None
    marquee_items: Optional[List[str]] = None

@api.get("/covers")
async def get_covers():
    doc = await db.settings.find_one({"key": "section_covers"}, {"_id": 0})
    stored = (doc or {}).get("value") or {}
    # Merge over defaults so newly-added keys (hero_images / hero_interval_seconds)
    # are always present in the response even if the stored doc is old.
    return {**DEFAULT_COVERS, **stored}

@api.put("/admin/covers")
async def update_covers(body: CoversIn, _admin=Depends(get_current_admin)):
    current = await db.settings.find_one({"key": "section_covers"}, {"_id": 0})
    value = (current or {}).get("value") or DEFAULT_COVERS.copy()
    if body.interiors_cover   is not None: value["interiors_cover"]   = body.interiors_cover
    if body.restoration_cover is not None: value["restoration_cover"] = body.restoration_cover
    if body.hero_extra        is not None: value["hero_extra"]        = [u.strip() for u in body.hero_extra if u.strip()]
    if body.hero_images       is not None: value["hero_images"]       = [u.strip() for u in body.hero_images if u.strip()]
    if body.hero_interval_seconds is not None:
        # clamp to [0.5s, 60s] to keep the ticker sane
        value["hero_interval_seconds"] = max(0.5, min(60.0, float(body.hero_interval_seconds)))
    if body.marquee_items is not None:
        # Trim / filter empties; XSS-sanitize each entry; cap at 24 items.
        clean = [sanitize_short(s, max_length=140) for s in body.marquee_items if str(s).strip()]
        clean = [s for s in clean if s]
        value["marquee_items"] = clean[:24] or DEFAULT_MARQUEE
    await db.settings.update_one(
        {"key": "section_covers"},
        {"$set": {"key": "section_covers", "value": value}},
        upsert=True,
    )
    return value

# ------------------------------------------------------------------ uploads
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_MIME = {
    # images
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif",
    # videos
    "video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/mpeg", "video/x-msvideo",
}
# No hard-coded ceiling — the admin can upload files of any size the network allows.
# (Uvicorn / reverse-proxy will still enforce their own transport limits.)
MAX_UPLOAD_BYTES = None

async def _background_transcode_video(src_path: str, fname: str, ext: str) -> None:
    """Background task: transcode a freshly-uploaded video to H.265 and push the
    smaller sibling to Emergent Object Storage. Runs after the upload response
    has already been returned so the admin never waits.
    """
    src_p = Path(src_path)
    if not src_p.exists():
        return
    base = fname.rsplit(".", 1)[0]
    h265_local = UPLOAD_DIR / f"__bg_{base}.h265.mp4"
    h265_storage = f"{STORAGE_APP}/uploads/{base}.h265.mp4"
    try:
        ok = await transcode_video_h265_async(str(src_p), str(h265_local))
        if not ok:
            logger.info(f"H.265 transcode declined for {fname}")
            return
        try:
            await put_object_from_file(h265_storage, h265_local, "video/mp4")
            logger.info(f"H.265 sibling uploaded: {h265_storage}")
        except Exception as e:
            logger.warning(f"H.265 upload failed for {fname}: {e}")
    finally:
        for p in (src_p, h265_local):
            try:
                if p.exists(): p.unlink()
            except OSError:
                pass


@api.post("/admin/upload")
async def upload_image(
    file: UploadFile = File(...),
    background: BackgroundTasks = None,
    _admin=Depends(get_current_admin),
):
    """Uploads a file (image or video) to Emergent Object Storage via a
    streaming disk temp file — RAM stays flat regardless of size. Falls back
    to local disk storage if object storage is unavailable at the moment.

    Video uploads: after the primary URL is returned, a background task
    transcodes the source to H.265 (HEVC) at a capped bitrate and uploads
    the smaller sibling alongside. This never blocks the admin response.
    """
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(400, f"Unsupported type: {file.content_type}")
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin").lower()

    # Stream to a temp file on disk in 1 MB chunks so the process memory stays flat.
    tmp = tempfile.NamedTemporaryFile(delete=False, dir=str(UPLOAD_DIR), suffix=f".{ext}")
    total = 0
    CHUNK = 1024 * 1024
    try:
        try:
            while True:
                chunk = await file.read(CHUNK)
                if not chunk:
                    break
                total += len(chunk)
                if MAX_UPLOAD_BYTES is not None and total > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, "File too large")
                tmp.write(chunk)
        finally:
            tmp.close()

        fname = f"{uuid.uuid4().hex}.{ext}"
        storage_path = f"{STORAGE_APP}/uploads/{fname}"

        # Prefer Emergent object storage (essentially unlimited capacity).
        try:
            await put_object_from_file(storage_path, Path(tmp.name), file.content_type or "application/octet-stream")
            # Public URL served by our own /api/files/... proxy.
            url = f"/api/files/{storage_path}"
            backend = "object-storage"
        except Exception as e:
            # Fallback: keep the temp file as the served asset so the upload
            # still succeeds even if the object store is momentarily flaky.
            logger.warning(f"Object storage upload failed, using local disk: {e}")
            local_path = UPLOAD_DIR / fname
            Path(tmp.name).rename(local_path)
            url = f"/api/uploads/{fname}"
            backend = "local"
            tmp_kept = str(local_path)
        else:
            # Object storage succeeded — schedule any post-processing BEFORE
            # deleting the temp file. If nothing wants it we clean up here.
            tmp_kept = None
            is_video = (file.content_type or "").startswith("video/")
            if is_video and background is not None and ffmpeg_available():
                # Move the temp file to a persistent location so the background
                # transcode still has the source after this handler returns.
                bg_src = UPLOAD_DIR / f"__bg_{fname}"
                try:
                    Path(tmp.name).replace(bg_src)
                    background.add_task(
                        _background_transcode_video,
                        str(bg_src),
                        fname,
                        ext,
                    )
                except Exception as e:
                    logger.warning(f"couldn't schedule H.265 transcode: {e}")
                    try: Path(tmp.name).unlink()
                    except Exception: pass
            else:
                try: Path(tmp.name).unlink()
                except Exception: pass

        response: dict = {
            "url": url, "filename": fname, "size": total,
            "content_type": file.content_type, "backend": backend,
        }
        if (file.content_type or "").startswith("video/"):
            # The H.265 sibling lives at a predictable path; the frontend can
            # try it as a <source> and fall back to the primary URL if the
            # transcode hasn't finished yet.
            response["h265_url"] = f"/api/files/{STORAGE_APP}/uploads/{fname.rsplit('.', 1)[0]}.h265.mp4"
            response["h265_status"] = "processing" if ffmpeg_available() else "unavailable"
        return response
    except HTTPException:
        try: Path(tmp.name).unlink()
        except Exception: pass
        raise
    except Exception as e:
        try: Path(tmp.name).unlink()
        except Exception: pass
        logger.exception("Upload failed")
        raise HTTPException(500, f"Upload failed: {e}")

# ---- Compatibility aliases so stale (cached) client bundles keep working ----
# Older builds of the admin console posted to /api/upload instead of
# /api/admin/upload. iOS Safari caches these hashed bundles aggressively, so
# without this alias existing users see 404s until they clear browser cache.
@api.post("/upload")
async def upload_image_alias(file: UploadFile = File(...), _admin=Depends(get_current_admin)):
    return await upload_image(file=file, _admin=_admin)


# ------------------------------------------------------------------ /files/* streaming proxy
# Serves objects stored in Emergent Object Storage back to the browser.
# Uses HTTP streaming so large videos (multi-GB) play with zero server-side
# buffering.
@api.get("/files/{path:path}")
async def get_file(path: str, request: Request):
    """
    Streaming proxy for Emergent Object Storage assets.

    * Video / PDF / octet-stream — streamed byte-for-byte, no transcoding.
    * JPEG / PNG — buffered in memory (typical asset ≤ 2 MB) and re-encoded
      to AVIF or WebP when the browser advertises support. Re-encoded
      copies are cached on-disk under MEDIA_CACHE_DIR so subsequent hits
      pay zero CPU.

    Falls back to the untouched raw stream if transcoding fails for any
    reason — never leaves the client without a byte.
    """
    try:
        upstream, content_type = await get_object_stream(path)
    except Exception as e:
        logger.warning(f"Object fetch failed for {path}: {e}")
        raise HTTPException(404, "File not found")

    accept = request.headers.get("accept") or ""
    long_cache = "public, max-age=31536000, immutable"

    # --- 1) transcodable image branch -------------------------------------
    if is_transcodable_image(content_type) and negotiate_image_format(accept):
        try:
            # Buffer the whole file to memory — safe for the ≤ few-MB photos
            # served here. Videos hit the streaming branch below.
            buf = bytearray()
            async for chunk in upstream.aiter_bytes(chunk_size=64 * 1024):
                buf.extend(chunk)
            await upstream.aclose()
            client = getattr(upstream, "_caremanto_client", None)
            if client is not None:
                try: await client.aclose()
                except Exception: pass

            raw = bytes(buf)
            result = maybe_transcoded_bytes(path, raw, content_type, accept)
            if result is not None:
                data, mime, fmt = result
                return Response(
                    content=data,
                    media_type=mime,
                    headers={
                        "Cache-Control": long_cache,
                        "Vary": "Accept",
                        "X-Caremanto-Transcoded": fmt,
                    },
                )
            # Transcoding declined → serve the raw bytes we already buffered.
            return Response(
                content=raw,
                media_type=content_type,
                headers={"Cache-Control": long_cache, "Vary": "Accept"},
            )
        except Exception as e:
            logger.warning(f"transcode branch failed for {path}: {e}")
            # If we already consumed the upstream body, re-open it below.
            try:
                upstream, content_type = await get_object_stream(path)
            except Exception:
                raise HTTPException(500, "File stream failed")

    # --- 2) plain streaming branch (videos, PDFs, unsupported images) -----
    async def _iter():
        try:
            async for chunk in upstream.aiter_bytes(chunk_size=64 * 1024):
                if chunk:
                    yield chunk
        finally:
            await upstream.aclose()
            client = getattr(upstream, "_caremanto_client", None)
            if client is not None:
                try: await client.aclose()
                except Exception: pass

    headers = {"Cache-Control": long_cache, "Vary": "Accept"}
    if "Content-Length" in upstream.headers:
        headers["Content-Length"] = upstream.headers["Content-Length"]
    return StreamingResponse(_iter(), media_type=content_type, headers=headers)


# ------------------------------------------------------------------ health
@api.get("/")
async def root():
    return {"service": "Caremanto Solutions API", "status": "ok"}

# ------------------------------------------------------------------ startup
SAMPLE_PROJECTS = [
    {
        "title": "The Marble Enfilade",
        "category": "interiors",
        "subcategory": "Residential",
        "location": "Mumbai, IN",
        "year": "2024",
        "story": "A private residence composed as a slow procession of stone, brass and northern light.",
        "cover_image": "https://images.pexels.com/photos/34688219/pexels-photo-34688219.jpeg",
        "images": [
            "https://images.pexels.com/photos/34688219/pexels-photo-34688219.jpeg",
            "https://images.pexels.com/photos/33685861/pexels-photo-33685861.jpeg",
        ],
        "featured": True,
        "is_sample": True,
    },
    {
        "title": "Chambers of Light",
        "category": "interiors",
        "subcategory": "Hospitality",
        "location": "Udaipur, IN",
        "year": "2024",
        "story": "A boutique hotel wing where every threshold reframes the horizon.",
        "cover_image": "https://images.pexels.com/photos/33685861/pexels-photo-33685861.jpeg",
        "images": ["https://images.pexels.com/photos/33685861/pexels-photo-33685861.jpeg"],
        "featured": True,
        "is_sample": True,
    },
    {
        "title": "Atelier on Marine Drive",
        "category": "interiors",
        "subcategory": "Commercial",
        "location": "Mumbai, IN",
        "year": "2023",
        "story": "A working atelier disguised as a gallery — proportion, restraint, one perfect curve.",
        "cover_image": "https://images.pexels.com/photos/33685863/pexels-photo-33685863.jpeg",
        "images": ["https://images.pexels.com/photos/33685863/pexels-photo-33685863.jpeg"],
        "featured": False,
        "is_sample": True,
    },
    {
        "title": "The Brick Almanac",
        "category": "restoration",
        "subcategory": "Heritage Restoration",
        "location": "Kolkata, IN",
        "year": "2024",
        "story": "A century-old warehouse quietly returned to its structural poetry.",
        "cover_image": "https://images.pexels.com/photos/7389533/pexels-photo-7389533.jpeg",
        "images": ["https://images.pexels.com/photos/7389533/pexels-photo-7389533.jpeg"],
        "featured": True,
        "is_sample": True,
    },
    {
        "title": "Facade No. 07",
        "category": "restoration",
        "subcategory": "Facade Renewal",
        "location": "Pune, IN",
        "year": "2023",
        "story": "A colonial-era facade meticulously stitched, layer by layer.",
        "cover_image": "https://images.pexels.com/photos/36054139/pexels-photo-36054139.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "images": ["https://images.pexels.com/photos/36054139/pexels-photo-36054139.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"],
        "featured": False,
        "is_sample": True,
    },
    {
        "title": "Adaptive Reuse — Study 03",
        "category": "restoration",
        "subcategory": "Adaptive Reuse",
        "location": "Bengaluru, IN",
        "year": "2024",
        "story": "A textile mill reimagined as a quiet library of contemporary form.",
        "cover_image": "https://images.pexels.com/photos/31500951/pexels-photo-31500951.jpeg",
        "images": ["https://images.pexels.com/photos/31500951/pexels-photo-31500951.jpeg"],
        "featured": False,
        "is_sample": True,
    },
]

SAMPLE_GALLERY = []  # no more seeded samples; site is fully populated from realProjects.js / admin uploads

async def seed_admin_and_samples():
    # Admin seed
    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Studio Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL.lower()},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )

    # Sample projects seed (only if projects collection is empty)
    count = await db.projects.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        docs = [{**p, "id": str(uuid.uuid4()), "created_at": now, "updated_at": now} for p in SAMPLE_PROJECTS]
        await db.projects.insert_many(docs)
        logger.info(f"Seeded {len(docs)} sample projects")

    # Sample gallery seed — auto-migrate old-schema samples (space/segment fields)
    stale = await db.gallery.count_documents({"space": {"$exists": True}})
    if stale > 0:
        await db.gallery.delete_many({"is_sample": True})
        # Also nuke stale taxonomy if it uses old shape
        await db.settings.delete_one({"key": "gallery_taxonomy"})
        logger.info(f"Migrated stale gallery samples (removed {stale} old-schema docs)")

    # Rename any legacy sub-category values so the new Gallery structure can
    # find them (e.g. "Balcony - Dry Area" → "Balcony / Dry Area / Temple").
    for old, new in SUBCATEGORY_ALIASES.items():
        if old == new:
            continue
        r = await db.gallery.update_many({"subcategory": old}, {"$set": {"subcategory": new}})
        if r.modified_count:
            logger.info(f"Migrated {r.modified_count} photos: {old!r} → {new!r}")

    # Promote any photo whose legacy `practice` field is "restoration" into the
    # new top-level RESTORATION & RENOVATIONS category, and clear its sub.
    r = await db.gallery.update_many(
        {"practice": "restoration"},
        {"$set": {"category": "RESTORATION & RENOVATIONS", "subcategory": ""}},
    )
    if r.modified_count:
        logger.info(f"Migrated {r.modified_count} photos: practice=restoration → RESTORATION & RENOVATIONS")

    # Force the taxonomy to match the current DEFAULT (Residential 5-card /
    # Commercial 3-card layout) — the previous seed used a longer list.
    await db.settings.update_one(
        {"key": "gallery_taxonomy"},
        {"$set": {"key": "gallery_taxonomy", "value": DEFAULT_TAXONOMY}},
        upsert=True,
    )

    g_count = await db.gallery.count_documents({})
    if g_count == 0 and SAMPLE_GALLERY:
        now = datetime.now(timezone.utc).isoformat()
        docs = [{**p, "id": str(uuid.uuid4()), "created_at": now} for p in SAMPLE_GALLERY]
        await db.gallery.insert_many(docs)
        logger.info(f"Seeded {len(docs)} sample gallery photos")

    # Indexes
    await db.users.create_index("email", unique=True)
    await db.projects.create_index([("category", 1), ("created_at", -1)])
    await db.gallery.create_index([("category", 1), ("subcategory", 1), ("created_at", -1)])
    await db.leads.create_index("created_at")
    await db.settings.create_index("key", unique=True)

@app.on_event("startup")
async def on_startup():
    # Indexes — dramatically speeds up admin filters and public-site reads.
    try:
        await db.gallery.create_index("category")
        await db.gallery.create_index("subcategory")
        await db.gallery.create_index("featured_home")
        await db.gallery.create_index("featured_portfolio")
        await db.gallery.create_index("is_cover")
        await db.gallery.create_index("created_at")
        await db.gallery.create_index([("category", 1), ("subcategory", 1)])
        await db.videos.create_index("featured_home")
        await db.leads.create_index("created_at")
        await db.leads.create_index("customer_uid")
        logger.info("Mongo indexes ensured.")
    except Exception as e:
        logger.warning(f"Index creation skipped: {e}")

    # Warm up the object storage session key (non-fatal on failure).
    try:
        await init_storage()
    except Exception as e:
        logger.warning(f"Object storage init deferred: {e}")
    try:
        await seed_admin_and_samples()
    except Exception as e:
        logger.error(f"Startup seed failed: {e}")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# ------------------------------------------------------------------ SEO: sitemap + robots (dev-only fallback)
# Preview ingress only exposes `/api/*` — the real robots.txt / sitemap.xml
# are served as static files from /app/frontend/public/. The `/api/…`
# aliases below are for local development, curl tests, and CI checks.
@api.get("/sitemap.xml")
async def sitemap_xml():
    """
    Search-engine sitemap for Caremanto Solutions (dev-only fallback).

    Static routes are always present. Portfolio sub-folders are enumerated
    from the current gallery taxonomy so newly-added categories appear the
    moment the next crawl happens.
    """
    from datetime import date
    site = os.environ.get("PUBLIC_SITE_URL", "https://caremanto.in").rstrip("/")
    today = date.today().isoformat()

    static_paths = [
        ("/", 1.0, "weekly"),
        ("/works", 0.9, "weekly"),
        ("/gallery", 0.9, "weekly"),
        ("/studio", 0.7, "monthly"),
        ("/approach", 0.7, "monthly"),
        ("/contact", 0.7, "monthly"),
        ("/films", 0.6, "monthly"),
    ]

    RESI = ["hall-dining", "bedrooms", "bathrooms", "kitchens", "balcony-dry-area-temple"]
    COMM = ["office-spaces", "retail-design", "hospitality"]
    for slug in RESI:
        static_paths.append((f"/gallery/residential/{slug}", 0.8, "weekly"))
    for slug in COMM:
        static_paths.append((f"/gallery/commercial/{slug}", 0.8, "weekly"))
    static_paths.append(("/gallery/restoration", 0.8, "weekly"))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, priority, freq in static_paths:
        lines.append("<url>")
        lines.append(f"<loc>{site}{path}</loc>")
        lines.append(f"<lastmod>{today}</lastmod>")
        lines.append(f"<changefreq>{freq}</changefreq>")
        lines.append(f"<priority>{priority}</priority>")
        lines.append("</url>")
    lines.append("</urlset>")
    return Response(content="\n".join(lines), media_type="application/xml")


@api.get("/robots.txt")
async def robots_txt():
    site = os.environ.get("PUBLIC_SITE_URL", "https://caremanto.in").rstrip("/")
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /admin/\n"
        "Disallow: /api/admin\n"
        f"Sitemap: {site}/sitemap.xml\n"
    )
    return Response(content=body, media_type="text/plain")


# ------------------------------------------------------------------ mount
app.include_router(api)
# Serve uploaded gallery images
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.middleware("http")
async def no_store_for_dynamic_api(request: Request, call_next):
    """Force browsers to always revalidate dynamic /api responses so admin
    edits are visible on the public site instantly. Static asset routes
    (/api/uploads, /api/files) keep their own long-lived cache headers.
    """
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/api/") and not path.startswith("/api/uploads") and not path.startswith("/api/files"):
        response.headers["Cache-Control"] = "no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------ compression
# Brotli/Gzip transparent compression for every JSON/HTML/JS/CSS response
# above 500 bytes. Static image/video payloads are excluded from
# recompression by Starlette (they're not text-encodable).
app.add_middleware(GZipMiddleware, minimum_size=500, compresslevel=6)


# ------------------------------------------------------------------ security headers
@app.middleware("http")
async def apply_security_headers(request: Request, call_next):
    """Ship strict headers on every response.

    CSP is initially in *report-only* mode so we can observe violations from
    Google Drive / Pexels / social CDN images without breaking the live
    site. Flip to enforcement (`Content-Security-Policy`) after the report
    log is clean.
    """
    try:
        response = await call_next(request)
    except Exception:
        # If the downstream handler crashed / the client disconnected mid
        # transcode, BaseHTTPMiddleware raises "No response returned." — we
        # let the standard error path surface the failure without adding
        # header noise (there's no response object to attach to).
        raise
    for header, value in SECURITY_HEADERS.items():
        # Never overwrite a header a specific route has already set intentionally.
        response.headers.setdefault(header, value)
    # CSP report-only — safe rollout mode.
    response.headers.setdefault("Content-Security-Policy-Report-Only", CSP_REPORT_ONLY)
    # HSTS: preview environment terminates TLS upstream; announce a long
    # HSTS window so browsers pin HTTPS in production too.
    response.headers.setdefault(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
    )
    return response
