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
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

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
    project_type: str
    budget: Optional[str] = ""
    message: str

class Lead(LeadIn):
    id: str
    status: str = "new"
    created_at: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GalleryPhotoIn(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: str                     # one of the 4 main tabs
    subcategory: Optional[str] = ""   # nested filter (only for the two nested categories)
    image: str
    is_sample: bool = False

class GalleryPhoto(GalleryPhotoIn):
    id: str
    created_at: str

class TaxonomyIn(BaseModel):
    categories: List[str]
    subcategories: dict  # { "Home Spaces & Corners": [...], "Commercial Spaces": [...] }

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
    doc = {**body.model_dump(), "id": str(uuid.uuid4()), "status": "new", "created_at": now}
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    # fire-and-forget email
    try:
        await send_notification_email(
            subject=f"New consultation — {doc['name']}",
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
    "categories": [
        "Our Work",
        "Home Spaces & Corners",
        "Bespoke Custom Made Furniture",
        "Commercial Spaces",
    ],
    "subcategories": {
        "Home Spaces & Corners": [
            "Kitchen", "Bathrooms", "Bedrooms", "Hall", "Balcony", "Dry Area",
        ],
        "Commercial Spaces": [
            "Office Spaces", "Retail Design", "Hospitality",
        ],
    },
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
async def list_gallery(category: Optional[str] = None, subcategory: Optional[str] = None):
    q: dict = {}
    if category:
        q["category"] = category
    if subcategory:
        q["subcategory"] = subcategory
    docs = await db.gallery.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs

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

SAMPLE_GALLERY = [
    # Home Spaces & Corners
    {"title": "Marble Vanity Study", "description": "", "category": "Home Spaces & Corners", "subcategory": "Bathrooms",
     "image": "https://images.pexels.com/photos/6438752/pexels-photo-6438752.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Bedroom in Ivory", "description": "", "category": "Home Spaces & Corners", "subcategory": "Bedrooms",
     "image": "https://images.pexels.com/photos/34688219/pexels-photo-34688219.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Kitchen Volume", "description": "", "category": "Home Spaces & Corners", "subcategory": "Kitchen",
     "image": "https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Living Hall", "description": "", "category": "Home Spaces & Corners", "subcategory": "Hall",
     "image": "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Balcony Bench", "description": "", "category": "Home Spaces & Corners", "subcategory": "Balcony",
     "image": "https://images.pexels.com/photos/7389533/pexels-photo-7389533.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Dry Utility Corner", "description": "", "category": "Home Spaces & Corners", "subcategory": "Dry Area",
     "image": "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},

    # Bespoke Custom Made Furniture (no sub-filters)
    {"title": "Walnut Console", "description": "", "category": "Bespoke Custom Made Furniture", "subcategory": "",
     "image": "https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Concealed Wardrobe", "description": "", "category": "Bespoke Custom Made Furniture", "subcategory": "",
     "image": "https://images.pexels.com/photos/33685861/pexels-photo-33685861.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Media Console", "description": "", "category": "Bespoke Custom Made Furniture", "subcategory": "",
     "image": "https://images.pexels.com/photos/31500951/pexels-photo-31500951.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},

    # Commercial Spaces
    {"title": "Atelier Workroom", "description": "", "category": "Commercial Spaces", "subcategory": "Office Spaces",
     "image": "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Boutique Interior", "description": "", "category": "Commercial Spaces", "subcategory": "Retail Design",
     "image": "https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
    {"title": "Hotel Lobby", "description": "", "category": "Commercial Spaces", "subcategory": "Hospitality",
     "image": "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1400", "is_sample": True},
]

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

    g_count = await db.gallery.count_documents({})
    if g_count == 0:
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
    try:
        await seed_admin_and_samples()
    except Exception as e:
        logger.error(f"Startup seed failed: {e}")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# ------------------------------------------------------------------ mount
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
