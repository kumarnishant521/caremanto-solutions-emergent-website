/**
 * =============================================================================
 *  CAREMANTO — REAL PROJECT IMAGE REGISTRY (curated for high-profile feel)
 * =============================================================================
 *  Add / edit / remove entries below to control what appears on the site.
 *  Each entry can carry any combination of placements:
 *    • hero        — cycles in the hero slideshow (choose the 6 most cinematic)
 *    • home        — appears in the home page bento gallery
 *    • gallery     — appears on /gallery under `category` (+ optional
 *                    `subcategory`)
 *
 *  URL pattern: photos are served from Google Drive via
 *      https://lh3.googleusercontent.com/d/<FILE_ID>=w<WIDTH>
 *  This CDN returns actual JPEG bytes and honours the width hint.
 * =============================================================================
 */

const g = (id, w = 1600) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;

export const REAL_PROJECTS = [
  /* ============================ HERO — 6 SLIDES ==============================
   * Curated for maximum cinematic impact:
   * black-marble bath, dramatic bedroom, tufted green bedroom, backlit pooja
   * feature, onyx bath, colour-block living. These also appear on the home
   * bento and in the gallery.
   * ========================================================================= */
  { id: "cm-hero-01", src: g("1R7y6VbXaCatlxEM9CMtqje3Tk6EvjIu7"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["hero", "home", "gallery"], origin: "center"      },
  { id: "cm-hero-02", src: g("1F9U9UjI9CHuxR-AkUvJZQRrom_oF10pm"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms",  placements: ["hero", "home", "gallery"], origin: "top right"   },
  { id: "cm-hero-03", src: g("1wQjQ5q3_OQLUc9uEULTSrLeKjqX5nSqc"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms",  placements: ["hero", "home", "gallery"], origin: "top left"    },
  { id: "cm-hero-04", src: g("1tMuPICaLjYIn8smCG0cize45rzG9DKPo"), kind: "residential", category: "Bespoke Custom Made Furniture",                    placements: ["hero", "home", "gallery"], origin: "center"      },
  { id: "cm-hero-05", src: g("13MWKA1jH24XcopBfsYtaFFPzztiaZ3tX"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["hero", "home", "gallery"], origin: "bottom right" },
  { id: "cm-hero-06", src: g("14YcOSbbJ5WTfw5wvkPBkfil_aOXvuvhn"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall",      placements: ["hero", "home", "gallery"], origin: "top right"   },

  /* ============================ BEDROOMS ==================================== */
  { id: "cm-b-01", src: g("1G7Y4USvC2T2DoC3oxzmlNeeUWvcHbzbl"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery"] },
  { id: "cm-b-02", src: g("1PO7Db-pwa4HYUeFAazHLw1k4kiLCoMYf"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery"] },
  { id: "cm-b-03", src: g("1o6YF-aqs8L9frHpsmpImjQgXNnF90xS-"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery"] },
  { id: "cm-b-04", src: g("1LmsUJbyx23kXMhugOFf4p4B-_7aSPgNP"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery"] },
  { id: "cm-b-05", src: g("1ls2Gkrvvr7rVVJXqg2yy7lXyarPWsGvs"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery"] },
  { id: "cm-b-06", src: g("1dlWWGnvYMd6vb3md5bsxvdrCur3NhxdL"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery"] },
  { id: "cm-b-07", src: g("1Nm7XQOitPx7oflpn3YOB8BV9Zr1RK6el"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery"] },
  { id: "cm-b-08", src: g("1K-aeEuPU6PK5aHkNp9PsgRzm2Z8AC4Nc"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery"] },
  { id: "cm-b-09", src: g("1gFyHiYuIHh1ERibAnrz1oL0fpDnjsSHo"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery"] },

  /* ============================ HALL / LIVING =============================== */
  { id: "cm-h-01", src: g("1-UqIIKIic8yFnSBcHQM8s4GYkGtPOzfS"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-02", src: g("1v5xbiio2oyFJt8mipmr6o6wQgYIg1tKq"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["home", "gallery"] },
  { id: "cm-h-03", src: g("18fvGqvVWhYsDf-L7II4dbH5FkQN7_F6R"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-04", src: g("1-DK7_Sb1BAp7lfkWgFD13osOwLCasNap"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-05", src: g("1CJlnSs102aoICFpm8rBdBqGqESZZFbLo"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-06", src: g("1z_zv0TFZuWHpGt8TgMPFXHkuwJ9jqJcg"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-07", src: g("1GFyl3ZvRNOhFk8GMqAfCDTHll4BfhBSw"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-08", src: g("1hWEhTw0GJMsU3oFATQeN-d-N_z4_Nc45"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["home", "gallery"] },
  { id: "cm-h-09", src: g("1JwopDLf3dKwSSaoF2pSPoonzC0jaldei"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-10", src: g("15-cKdOVb-ieBJd1MJDsRxtMb5QfnF37_"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-11", src: g("1kMDYNC8TcjEpAodSeyT6xuiZPgzoDA0j"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["home", "gallery"] },
  { id: "cm-h-12", src: g("1c4UOA8-mbxz19lENsj2fMQcGYU5K52nG"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-13", src: g("1zZTkcOqatXjPIZtszkO3uIxGJYWCgzbz"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },
  { id: "cm-h-14", src: g("1vpKZpuagiu6sdqQNqzGyC7ITDkw_Rus1"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery"] },

  /* ============================ KITCHEN ===================================== */
  { id: "cm-k-01", src: g("1kaIQJ1644ApGvIsbmRGR1PeC6iJnzsVu"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["home", "gallery"] },
  { id: "cm-k-02", src: g("1iOqh0QKtN9NJgaKe2TXx5qcXBncFipqw"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["gallery"] },
  { id: "cm-k-03", src: g("1jc2h3rv4_cWGh0x6ERUqbqBOlMAEaxim"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["gallery"] },
  { id: "cm-k-04", src: g("1XofS0seWQU7NNlYZ7AaemixPTjXZfu8j"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["home", "gallery"] },
  { id: "cm-k-05", src: g("1RteW_QD2n2rkv-SxjXq7WuihWTNZlIpw"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["gallery"] },

  /* ============================ BATHROOMS =================================== */
  { id: "cm-w-01", src: g("1c3hbjoAp50E7SRXekt_6C4HzsI9NVKUJ"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["gallery"] },
  { id: "cm-w-02", src: g("1ujjEIaupxhL_MIAzR8U8ePaJwyEc-y_m"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["home", "gallery"] },
  { id: "cm-w-03", src: g("1F_bZX-LG3j51uy9xh6Y7ZDPR9QUqLXHz"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["home", "gallery"] },
  { id: "cm-w-04", src: g("13bVMCrH-NR-uKaxPwV4EKx4gD-VBzHNx"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["gallery"] },
  { id: "cm-w-05", src: g("1C6sk6JJiNmD0qvgtBa65-eUIqH00ghko"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["gallery"] },

  /* ============================ BALCONY ===================================== */
  { id: "cm-y-01", src: g("1KK8a_dwufpSozzxr6H7M6Khm148a7atW"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Balcony", placements: ["gallery"] },

  /* ============================ DRY AREA ==================================== */
  { id: "cm-d-01", src: g("1bCGfutv-AuOdz_hWWo4lHHy0m-L74t4L"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Dry Area", placements: ["gallery"] },
  { id: "cm-d-02", src: g("1rBQPVDlIe16c8OHUYLYhAkbMmihjBnhz"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Dry Area", placements: ["gallery"] },
  { id: "cm-d-03", src: g("176BGZUutvuc0vo9KqyMihOOdCagPicbb"), kind: "residential", category: "Home Spaces & Corners", subcategory: "Dry Area", placements: ["gallery"] },

  /* ==================== BESPOKE CUSTOM MADE FURNITURE ======================= */
  { id: "cm-f-01", src: g("1z0FJO543cOCRM9hLGNQZNK091VqBjTZH"), kind: "residential", category: "Bespoke Custom Made Furniture", placements: ["gallery"] },
  { id: "cm-f-02", src: g("1wkIA4N7LougU_o4jpxv3mT8n3B5_oRUK"), kind: "residential", category: "Bespoke Custom Made Furniture", placements: ["home", "gallery"] },
  { id: "cm-f-03", src: g("1N7_4U-Bn4UNBM8mk0WANTVj3H7rcsqbN"), kind: "residential", category: "Bespoke Custom Made Furniture", placements: ["gallery"] },
];

/* ---------------------------------------------------------------- helpers */
export const heroImages = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("hero"))
    .map((p) => ({ src: p.src, kind: p.kind, origin: p.origin || "center" }));

export const homeGalleryImages = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("home"))
    .map((p) => ({ src: p.src, kind: p.kind, title: p.title || "" }));

export const galleryImages = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("gallery"))
    .map((p) => ({
      id: p.id,
      image: p.src,
      title: p.title || "",
      description: "",
      category: p.category,
      subcategory: p.subcategory || "",
      is_sample: false,
    }));
