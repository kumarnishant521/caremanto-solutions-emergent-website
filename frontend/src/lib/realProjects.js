/**
 * =============================================================================
 *  CAREMANTO — REAL PROJECT IMAGE REGISTRY
 * =============================================================================
 *  Each entry can carry ANY combination of these placements:
 *    • hero        — cycles in the hero slideshow (6 slots recommended)
 *    • home        — appears in the home page bento gallery
 *    • gallery     — appears on /gallery under `category` (+ optional `subcategory`)
 *    • works       — appears on /works under `discipline` + `practice`
 *
 *  Fields explained
 *    • kind         "residential" | "commercial"
 *    • discipline   "interiors" | "restoration"   (top-level nav)
 *    • practice     one of NAV_CATEGORIES[discipline].items  (sub-nav)
 *    • category     one of the four gallery tabs
 *    • subcategory  gallery sub-filter (Kitchen / Bedrooms / etc. — optional)
 *    • origin       Ken-Burns anchor for the hero (optional)
 *
 *  URL pattern:  https://lh3.googleusercontent.com/d/<FILE_ID>=w<WIDTH>
 * =============================================================================
 */

const g = (id, w = 1600) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;

export const REAL_PROJECTS = [

  /* ==============================================================
   *  HERO — 6 curated cinematic slides (from the /hero Drive folder)
   * ============================================================== */
  { id: "cm-hero-01", src: g("1l3oJvJiH32lZ9Uxit0TlEX9DL8L4Qw9r"), kind: "residential",
    discipline: "interiors", practice: "Residential",
    category: "Home Spaces & Corners", subcategory: "Bedrooms",
    placements: ["hero", "home", "gallery", "works"], origin: "center" },

  { id: "cm-hero-02", src: g("1Ge2KHZG-mJF9zcGj5_FVlDwRDvRJiNX2"), kind: "residential",
    discipline: "interiors", practice: "Residential",
    category: "Home Spaces & Corners", subcategory: "Bedrooms",
    placements: ["hero", "home", "gallery", "works"], origin: "top left" },

  { id: "cm-hero-03", src: g("1P1wOMact4rZVtQKDciv-QES6PviCUeRe"), kind: "residential",
    discipline: "interiors", practice: "Residential",
    category: "Home Spaces & Corners", subcategory: "Hall",
    placements: ["hero", "home", "gallery", "works"], origin: "bottom right" },

  { id: "cm-hero-04", src: g("1ETnL8nPYuyOJZ7QHZtTUcqYpt7gOIlRU"), kind: "commercial",
    discipline: "interiors", practice: "Hospitality",
    category: "Commercial Spaces", subcategory: "Hospitality",
    title: "Baked in Bombay — Storefront",
    placements: ["hero", "home", "gallery", "works"], origin: "center" },

  { id: "cm-hero-05", src: g("1s9JR773HpJpwwntR0ceGWaXHHQS2FoEY"), kind: "commercial",
    discipline: "interiors", practice: "Hospitality",
    category: "Commercial Spaces", subcategory: "Hospitality",
    title: "Baked in Bombay — Café",
    placements: ["hero", "home", "gallery", "works"], origin: "top right" },

  { id: "cm-hero-06", src: g("1toOehGGe1N5_nrIjA5s8V3KH85oYGNot"), kind: "commercial",
    discipline: "interiors", practice: "Hospitality",
    category: "Commercial Spaces", subcategory: "Hospitality",
    title: "Baked in Bombay — Counter",
    placements: ["hero", "home", "gallery", "works"], origin: "center" },

  /* ==============================================================
   *  BEDROOMS   (Home Spaces & Corners → Bedrooms)
   * ============================================================== */
  { id: "cm-b-01", src: g("1G7Y4USvC2T2DoC3oxzmlNeeUWvcHbzbl"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-b-02", src: g("1PO7Db-pwa4HYUeFAazHLw1k4kiLCoMYf"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-03", src: g("1o6YF-aqs8L9frHpsmpImjQgXNnF90xS-"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-04", src: g("1F9U9UjI9CHuxR-AkUvJZQRrom_oF10pm"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-b-05", src: g("1LmsUJbyx23kXMhugOFf4p4B-_7aSPgNP"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-06", src: g("1ls2Gkrvvr7rVVJXqg2yy7lXyarPWsGvs"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-07", src: g("15-cKdOVb-ieBJd1MJDsRxtMb5QfnF37_"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-08", src: g("1wQjQ5q3_OQLUc9uEULTSrLeKjqX5nSqc"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-b-09", src: g("1dlWWGnvYMd6vb3md5bsxvdrCur3NhxdL"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-b-10", src: g("1Nm7XQOitPx7oflpn3YOB8BV9Zr1RK6el"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-11", src: g("1K-aeEuPU6PK5aHkNp9PsgRzm2Z8AC4Nc"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },
  { id: "cm-b-12", src: g("1gFyHiYuIHh1ERibAnrz1oL0fpDnjsSHo"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bedrooms", placements: ["gallery", "works"] },

  /* ==============================================================
   *  HALL / LIVING
   * ============================================================== */
  { id: "cm-h-01", src: g("1-UqIIKIic8yFnSBcHQM8s4GYkGtPOzfS"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-02", src: g("1v5xbiio2oyFJt8mipmr6o6wQgYIg1tKq"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["home", "gallery", "works"] },
  { id: "cm-h-03", src: g("18fvGqvVWhYsDf-L7II4dbH5FkQN7_F6R"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-04", src: g("1-DK7_Sb1BAp7lfkWgFD13osOwLCasNap"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-05", src: g("1CJlnSs102aoICFpm8rBdBqGqESZZFbLo"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-06", src: g("1z_zv0TFZuWHpGt8TgMPFXHkuwJ9jqJcg"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-07", src: g("1GFyl3ZvRNOhFk8GMqAfCDTHll4BfhBSw"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-08", src: g("1hWEhTw0GJMsU3oFATQeN-d-N_z4_Nc45"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["home", "gallery", "works"] },
  { id: "cm-h-09", src: g("1JwopDLf3dKwSSaoF2pSPoonzC0jaldei"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-10", src: g("1kMDYNC8TcjEpAodSeyT6xuiZPgzoDA0j"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["home", "gallery", "works"] },
  { id: "cm-h-11", src: g("1c4UOA8-mbxz19lENsj2fMQcGYU5K52nG"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-12", src: g("1zZTkcOqatXjPIZtszkO3uIxGJYWCgzbz"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },
  { id: "cm-h-13", src: g("1vpKZpuagiu6sdqQNqzGyC7ITDkw_Rus1"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Hall", placements: ["gallery", "works"] },

  /* ==============================================================
   *  KITCHEN
   * ============================================================== */
  { id: "cm-k-01", src: g("1kaIQJ1644ApGvIsbmRGR1PeC6iJnzsVu"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["home", "gallery", "works"] },
  { id: "cm-k-02", src: g("1iOqh0QKtN9NJgaKe2TXx5qcXBncFipqw"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["gallery", "works"] },
  { id: "cm-k-03", src: g("1jc2h3rv4_cWGh0x6ERUqbqBOlMAEaxim"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["gallery", "works"] },
  { id: "cm-k-04", src: g("1XofS0seWQU7NNlYZ7AaemixPTjXZfu8j"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["home", "gallery", "works"] },
  { id: "cm-k-05", src: g("1RteW_QD2n2rkv-SxjXq7WuihWTNZlIpw"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Kitchen", placements: ["gallery", "works"] },

  /* ==============================================================
   *  BATHROOMS
   * ============================================================== */
  { id: "cm-w-01", src: g("1c3hbjoAp50E7SRXekt_6C4HzsI9NVKUJ"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["gallery", "works"] },
  { id: "cm-w-02", src: g("1ujjEIaupxhL_MIAzR8U8ePaJwyEc-y_m"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-w-03", src: g("1F_bZX-LG3j51uy9xh6Y7ZDPR9QUqLXHz"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-w-04", src: g("1R7y6VbXaCatlxEM9CMtqje3Tk6EvjIu7"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-w-05", src: g("13bVMCrH-NR-uKaxPwV4EKx4gD-VBzHNx"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["gallery", "works"] },
  { id: "cm-w-06", src: g("13MWKA1jH24XcopBfsYtaFFPzztiaZ3tX"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["home", "gallery", "works"] },
  { id: "cm-w-07", src: g("1C6sk6JJiNmD0qvgtBa65-eUIqH00ghko"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Bathrooms", placements: ["gallery", "works"] },

  /* ==============================================================
   *  BALCONY
   * ============================================================== */
  { id: "cm-y-01", src: g("1KK8a_dwufpSozzxr6H7M6Khm148a7atW"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Balcony", placements: ["gallery", "works"] },

  /* ==============================================================
   *  DRY AREA
   * ============================================================== */
  { id: "cm-d-01", src: g("1bCGfutv-AuOdz_hWWo4lHHy0m-L74t4L"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Dry Area", placements: ["gallery", "works"] },
  { id: "cm-d-02", src: g("1rBQPVDlIe16c8OHUYLYhAkbMmihjBnhz"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Dry Area", placements: ["gallery", "works"] },
  { id: "cm-d-03", src: g("176BGZUutvuc0vo9KqyMihOOdCagPicbb"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Home Spaces & Corners", subcategory: "Dry Area", placements: ["gallery", "works"] },

  /* ==============================================================
   *  BESPOKE CUSTOM MADE FURNITURE
   * ============================================================== */
  { id: "cm-f-01", src: g("1z0FJO543cOCRM9hLGNQZNK091VqBjTZH"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Bespoke Custom Made Furniture", placements: ["gallery", "works"] },
  { id: "cm-f-02", src: g("1wkIA4N7LougU_o4jpxv3mT8n3B5_oRUK"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Bespoke Custom Made Furniture", placements: ["home", "gallery", "works"] },
  { id: "cm-f-03", src: g("1tMuPICaLjYIn8smCG0cize45rzG9DKPo"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Bespoke Custom Made Furniture", placements: ["home", "gallery", "works"] },
  { id: "cm-f-04", src: g("1N7_4U-Bn4UNBM8mk0WANTVj3H7rcsqbN"), kind: "residential", discipline: "interiors", practice: "Residential", category: "Bespoke Custom Made Furniture", placements: ["gallery", "works"] },
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

/**
 * Return "projects" for the /works page.
 * Every real photograph is treated as a project card so the nav dropdowns
 * (Interior Projects → Residential/Commercial/... and Services → ...)
 * always show real content.
 */
export const worksProjects = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("works"))
    .map((p) => ({
      id: p.id,
      title: p.title || (p.subcategory || p.practice || ""),
      category:    p.discipline || "interiors",   // "interiors" | "restoration"
      subcategory: p.practice   || "",            // matches NAV sub-item
      location: "",
      year: "",
      story: "",
      cover_image: p.src,
      images: [p.src],
      featured: p.placements.includes("hero"),
      is_sample: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
