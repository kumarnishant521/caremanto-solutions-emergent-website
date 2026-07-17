"""One-off ingest: bulk load the studio's Google Drive "Portfolio 3" folder into the gallery."""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

DRIVE_IDS = [
    "10E_6sG6_9TM8qtG4yx0xvLeXqoSwXJAg", "11gUzrDRn6WDj1sSTHmUC5JvjyLu1pNtw",
    "14BqjtuGYzAC3OP5x22TcPOcbr5ztoSpd", "16ex3ZO0ABXKP2g0LS_Rtyzri_vxsUNJx",
    "18k5sSbJaE2ny0BW6JXCUEUwi0oq5sF6A", "19fyukYjA_-3-Fl3yi6mD5QnVWLJvxfzB",
    "1A8s1mSXgWtjzRzyhYxlE58-jp-vSxIP_", "1BOo4_I6urUnrtjev_ELqyK7MpGfnQfXM",
    "1BYRboVRDyYeMiEY9ec27qGZdpL9QUKf5", "1I8272n605Ksz4s2tFb-XL8jbFATod57D",
    "1Iv4XmnbMAj6AkVyGzD2OSCqJrc1RJU3L", "1J0wVRB3zIlHO2Ubr88HkPH2xYLA5w1gC",
    "1J5kN3icfPcXqu2ZLBlkeZ6mMZdCYgULe", "1JPrAlArc_KOqyl0aS1JTG-XVGIv5E1uN",
    "1KAzhLR0GmM6Sgb-qywtwZHzRH5HWeosW", "1LdPxP_OUHws390ZRjirDC6fttR4GN7ry",
    "1MdZPIVFa0HEtj4AcGqh9aFtVXrm3rvb3", "1MgJbqC98c71BGgHQnCMADh5dK-s56uXF",
    "1MuyWTfeAHDrQbxXpkY23pPdagfWmYDME", "1NObGnKlWQaJ_zTHcZFpx9iBZZeWOUn8y",
    "1Ntfuhg88zUHgc4eH9NWB6zRcG1wH7TDM", "1SVuXcbnz11C8GQDT9_9FnC1aLBRxI0zc",
    "1SvrUZi3X6Rq5EPzaGa0Q423_SQnq5ceV", "1Tt8RYDyM84I22WmTqCf1TUFtWZhoYi4n",
    "1U0y88mh5ruJkxXgr4gHF8H6kJgtfp6KB", "1VpLUiGsT_GwNObcPtFGQu3E7xgjUuGsk",
    "1XOuQvdHQo85qT-ltQLfBcCX2KqM7o3DO", "1Za55UK7pTwe95ob4-pwmZvScS_vIphKm",
    "1_puPVHRwb7DIaHjiRKcx7CJcF0tIbGjd", "1b1q8Btqn5qblCcfkQsLWNt_56f5I17IF",
    "1bCvSRr7f-X8ihOaUr4oGVsGPY4QYuaN7", "1cvAT3bnLE_OkQAsUeCWCjf-KlXrDHzFV",
    "1f20GLdJH0YeR_e2tJ0TShSmCqJieSKiS", "1iEkjV3PtWTlS_Oaa5jNodhh8pdlFiAZS",
    "1jyxnk6nv7ASEn9REey9wlWq9RH8CFY9y", "1l-rW6REjwyEG9JJS0jVx5ckzySwCR3Xr",
    "1lqdlh-7j4UccES9928XXaZOZL7bmL3Se", "1nllhYxOfiB15GVZ6Ejxf-ArOomRf4rXB",
    "1pNFxCv1I3_w7vMyFagM6xAZ38WmfmDi8", "1qx79Z-1Hv6TYWCB55685Oai-wpFK_VQw",
    "1u5We3idz9IHEDaLTP_dl0e-rL3PDNW86", "1uZNs06uxEGpX72jGqgn9gQ4c7QDG1Wod",
    "1uZk6dpOY83sBDZsf03QaQE43fFyT4UQ-", "1vK79xEK3mW-aKmC8SVBjIg8VSh5PqK4K",
    "1vSEW1cjNQLxgooaokxeIJL0SG8Wauxc0", "1wZLn8OFdW9qEqf4mqvIkQ1NANML0jWvt",
    "1z4d_IR9i5GqQMIou_mlOy6LPyj3zITXn", "1zHFeM8vnM1ci2qNwXOo8aYKPWrEKj66Y",
]

# Rotate across sub-categories so each filter tab has some content.
RES_SUBS = ["Bedrooms", "Bathrooms", "Kitchen", "Hall & Dining", "Balcony - Dry Area", "Temple"]
COM_SUBS = ["Hospitality", "Retail Design", "Office Spaces"]


def build_url(file_id: str, w: int = 1600) -> str:
    return f"https://lh3.googleusercontent.com/d/{file_id}=w{w}"


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    existing_urls = set()
    async for doc in db.gallery.find({}, {"image": 1}):
        existing_urls.add(doc.get("image", ""))

    now_iso = datetime.now(timezone.utc).isoformat()
    added = 0
    for idx, fid in enumerate(DRIVE_IDS):
        url = build_url(fid)
        if url in existing_urls:
            continue
        # split ~70/30 residential/commercial
        if idx % 10 < 7:
            category = "RESIDENTIAL"
            subcategory = RES_SUBS[idx % len(RES_SUBS)]
        else:
            category = "COMMERCIAL"
            subcategory = COM_SUBS[idx % len(COM_SUBS)]
        doc = {
            "id": str(uuid.uuid4()),
            "title": "",
            "description": "",
            "category": category,
            "subcategory": subcategory,
            "image": url,
            "is_sample": False,
            "featured_home": idx < 10,  # feature first 10 on home bento
            "created_at": now_iso,
        }
        await db.gallery.insert_one(doc)
        added += 1
    print(f"Inserted {added} photographs (skipped {len(DRIVE_IDS) - added} duplicates).")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
