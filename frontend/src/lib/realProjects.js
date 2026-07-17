/**
 * =============================================================================
 *  CAREMANTO — REAL PROJECT IMAGE REGISTRY  (2-tier taxonomy)
 * =============================================================================
 *  Gallery taxonomy (parent → children):
 *     RESIDENTIAL  → Bedrooms · Bathrooms · Kitchen · Hall & Dining ·
 *                    Balcony - Dry Area · Temple
 *     COMMERCIAL   → Hospitality · Retail Design · Office Spaces
 *
 *  URL pattern: https://lh3.googleusercontent.com/d/<FILE_ID>=w<WIDTH>
 * =============================================================================
 */
const g = (id, w = 1800) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;

/* --- 23 IDs from the new hero-slideshow Drive folder ---------------------- */
const HERO20 = [
  "1Xl_R8nCAVYZdU1VgEMg0p88zP_F1MQuL","1zPq-EotAlqSrWD990fjVuqj1ySZysKQD",
  "1nHaH3vPj-KN77QdThW1XsbjxQxv0SGFU","15JzH5gsGL_l9u4U5ocUYXWfqzZhbZ1-y",
  "1cn6ykYIPoBdip7sv9FjMP0Q5_xSGTtRg","1VQK7EgZOUWpAsOnjZ9pq2KqhQYEWrsWX",
  "13EuJdh8qA-_8dtUbAqt5iSLTcygxm4_c","1gtnlRyoVPd7ra_C8IU9WQ4brjV3UIvOl",
  "1-A71WIgsToE_LTfI18BFh3inWBrTLqg1","1QNGjk1AZirsoh9zKzcP6LiaIQBIF4Jx9",
  "1eFdrCgO_Jzurfog7zKAwwkMR4vB6j3tq","1fozwu0Xk2cNYqAreFvH2ri0VkXhYDdTh",
  "1jZ9cOd7dscAId2DRYOocvwombcMqIsPZ","19TQfmq_P-M3v9jOXs0Wy9QIJtCAsE8MG",
  "1V4bpcbF0VvEp-c4cYnahfk-VHapktcg2","1GTToKQVPcZGFIW4klwg3NAGtofLNzJdI",
  "10K7MSonUxGhWqSEBJTM0veI_8b5Wx6fb","1K_1zcpjkP2juEXrTo62g6ODNyfeg3ahJ",
  "1lK6W7t-nH6tUSo4iA3ktBkmtt-_YxjHA","1JpvsqypIszXmyO9MJQfV793QRWDA1NKi",
  "14Nn5yK6x2zAUFFnhcnUubYc_INfxowN2","1Fkktwr12a5EN_oqKFlAfs9c2TcFJ3Y37",
  "1aa3IJ5B36HDJcACG7Jro192Z8CVQH1e_",
];

const HERO_ENTRIES = HERO20.map((id, i) => ({
  id: `cm-hero-${String(i + 1).padStart(2, "0")}`,
  src: g(id, 1800),
  kind: i % 3 === 0 ? "commercial" : "residential",
  discipline: "interiors",
  practice: "Residential",
  category: "RESIDENTIAL",
  subcategory: "Bedrooms",
  placements: ["hero"],
  origin: ["center","top left","bottom right","top right","bottom left"][i % 5],
}));

/* Original bedroom that user first shared — kept in the hero rotation. */
HERO_ENTRIES.push({
  id: "cm-hero-primary",
  src: "https://customer-assets-v7afamib.emergentagent.net/job_design-restore-pro/artifacts/2thkoaxu_IMG_5301.png",
  kind: "residential", discipline: "interiors", practice: "Residential",
  category: "RESIDENTIAL", subcategory: "Bedrooms",
  placements: ["hero"], origin: "center",
});

export const REAL_PROJECTS = [
  ...HERO_ENTRIES,

  /* ===========================  BEDROOMS  ================================ */
  { id:"cm-b-01", src:g("1G7Y4USvC2T2DoC3oxzmlNeeUWvcHbzbl"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["home","gallery","works"] },
  { id:"cm-b-02", src:g("1PO7Db-pwa4HYUeFAazHLw1k4kiLCoMYf"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-03", src:g("1o6YF-aqs8L9frHpsmpImjQgXNnF90xS-"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-04", src:g("1F9U9UjI9CHuxR-AkUvJZQRrom_oF10pm"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["home","gallery","works"] },
  { id:"cm-b-05", src:g("1LmsUJbyx23kXMhugOFf4p4B-_7aSPgNP"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-06", src:g("1ls2Gkrvvr7rVVJXqg2yy7lXyarPWsGvs"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-07", src:g("15-cKdOVb-ieBJd1MJDsRxtMb5QfnF37_"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-08", src:g("1wQjQ5q3_OQLUc9uEULTSrLeKjqX5nSqc"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["home","gallery","works"] },
  { id:"cm-b-09", src:g("1dlWWGnvYMd6vb3md5bsxvdrCur3NhxdL"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["home","gallery","works"] },
  { id:"cm-b-10", src:g("1Nm7XQOitPx7oflpn3YOB8BV9Zr1RK6el"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-11", src:g("1K-aeEuPU6PK5aHkNp9PsgRzm2Z8AC4Nc"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },
  { id:"cm-b-12", src:g("1gFyHiYuIHh1ERibAnrz1oL0fpDnjsSHo"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bedrooms", placements:["gallery","works"] },

  /* ===========================  HALL & DINING  =========================== */
  { id:"cm-h-01", src:g("1-UqIIKIic8yFnSBcHQM8s4GYkGtPOzfS"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-02", src:g("1v5xbiio2oyFJt8mipmr6o6wQgYIg1tKq"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["home","gallery","works"] },
  { id:"cm-h-03", src:g("18fvGqvVWhYsDf-L7II4dbH5FkQN7_F6R"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-04", src:g("1-DK7_Sb1BAp7lfkWgFD13osOwLCasNap"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-05", src:g("1CJlnSs102aoICFpm8rBdBqGqESZZFbLo"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-06", src:g("1z_zv0TFZuWHpGt8TgMPFXHkuwJ9jqJcg"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-07", src:g("1GFyl3ZvRNOhFk8GMqAfCDTHll4BfhBSw"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-08", src:g("1hWEhTw0GJMsU3oFATQeN-d-N_z4_Nc45"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["home","gallery","works"] },
  { id:"cm-h-09", src:g("1JwopDLf3dKwSSaoF2pSPoonzC0jaldei"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-10", src:g("1kMDYNC8TcjEpAodSeyT6xuiZPgzoDA0j"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["home","gallery","works"] },
  { id:"cm-h-11", src:g("1c4UOA8-mbxz19lENsj2fMQcGYU5K52nG"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-12", src:g("1zZTkcOqatXjPIZtszkO3uIxGJYWCgzbz"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },
  { id:"cm-h-13", src:g("1vpKZpuagiu6sdqQNqzGyC7ITDkw_Rus1"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Hall & Dining", placements:["gallery","works"] },

  /* ===========================  KITCHEN  ================================= */
  { id:"cm-k-01", src:g("1kaIQJ1644ApGvIsbmRGR1PeC6iJnzsVu"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Kitchen", placements:["home","gallery","works"] },
  { id:"cm-k-02", src:g("1iOqh0QKtN9NJgaKe2TXx5qcXBncFipqw"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Kitchen", placements:["gallery","works"] },
  { id:"cm-k-03", src:g("1jc2h3rv4_cWGh0x6ERUqbqBOlMAEaxim"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Kitchen", placements:["gallery","works"] },
  { id:"cm-k-04", src:g("1XofS0seWQU7NNlYZ7AaemixPTjXZfu8j"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Kitchen", placements:["home","gallery","works"] },
  { id:"cm-k-05", src:g("1RteW_QD2n2rkv-SxjXq7WuihWTNZlIpw"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Kitchen", placements:["gallery","works"] },

  /* ===========================  BATHROOMS  =============================== */
  { id:"cm-w-01", src:g("1c3hbjoAp50E7SRXekt_6C4HzsI9NVKUJ"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["gallery","works"] },
  { id:"cm-w-02", src:g("1ujjEIaupxhL_MIAzR8U8ePaJwyEc-y_m"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["home","gallery","works"] },
  { id:"cm-w-03", src:g("1F_bZX-LG3j51uy9xh6Y7ZDPR9QUqLXHz"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["home","gallery","works"] },
  { id:"cm-w-04", src:g("1R7y6VbXaCatlxEM9CMtqje3Tk6EvjIu7"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["home","gallery","works"] },
  { id:"cm-w-05", src:g("13bVMCrH-NR-uKaxPwV4EKx4gD-VBzHNx"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["gallery","works"] },
  { id:"cm-w-06", src:g("13MWKA1jH24XcopBfsYtaFFPzztiaZ3tX"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["home","gallery","works"] },
  { id:"cm-w-07", src:g("1C6sk6JJiNmD0qvgtBa65-eUIqH00ghko"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Bathrooms", placements:["gallery","works"] },

  /* ===========================  BALCONY - DRY AREA  ====================== */
  { id:"cm-y-01", src:g("1KK8a_dwufpSozzxr6H7M6Khm148a7atW"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Balcony - Dry Area", placements:["gallery","works"] },
  { id:"cm-d-01", src:g("1bCGfutv-AuOdz_hWWo4lHHy0m-L74t4L"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Balcony - Dry Area", placements:["gallery","works"] },
  { id:"cm-d-02", src:g("1rBQPVDlIe16c8OHUYLYhAkbMmihjBnhz"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Balcony - Dry Area", placements:["gallery","works"] },
  { id:"cm-d-03", src:g("176BGZUutvuc0vo9KqyMihOOdCagPicbb"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Balcony - Dry Area", placements:["gallery","works"] },

  /* ===========================  TEMPLE (pooja units)  ==================== */
  { id:"cm-t-01", src:g("1tMuPICaLjYIn8smCG0cize45rzG9DKPo"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Temple", placements:["home","gallery","works"] },
  { id:"cm-t-02", src:g("1wkIA4N7LougU_o4jpxv3mT8n3B5_oRUK"), kind:"residential", discipline:"interiors", practice:"Residential", category:"RESIDENTIAL", subcategory:"Temple", placements:["gallery","works"] },

  /* ===========================  COMMERCIAL — HOSPITALITY  ================ */
  { id:"cm-c-hosp-01", src:g("1ETnL8nPYuyOJZ7QHZtTUcqYpt7gOIlRU"), kind:"commercial", discipline:"interiors", practice:"Hospitality", category:"COMMERCIAL", subcategory:"Hospitality", title:"Baked in Bombay — Storefront", placements:["home","gallery","works"] },
  { id:"cm-c-hosp-02", src:g("1s9JR773HpJpwwntR0ceGWaXHHQS2FoEY"), kind:"commercial", discipline:"interiors", practice:"Hospitality", category:"COMMERCIAL", subcategory:"Hospitality", title:"Baked in Bombay — Café",       placements:["home","gallery","works"] },
  { id:"cm-c-hosp-03", src:g("1toOehGGe1N5_nrIjA5s8V3KH85oYGNot"), kind:"commercial", discipline:"interiors", practice:"Hospitality", category:"COMMERCIAL", subcategory:"Hospitality", title:"Baked in Bombay — Counter",    placements:["home","gallery","works"] },
];

/* ---------------------------------------------------------------- helpers */
export const heroImages = () =>
  REAL_PROJECTS.filter((p) => p.placements?.includes("hero"))
    .map((p) => ({ src: p.src, kind: p.kind, origin: p.origin || "center" }));

export const homeGalleryImages = () =>
  REAL_PROJECTS.filter((p) => p.placements?.includes("home"))
    .map((p) => ({ src: p.src, kind: p.kind, title: p.title || "" }));

export const galleryImages = () =>
  REAL_PROJECTS.filter((p) => p.placements?.includes("gallery"))
    .map((p) => ({
      id: p.id, image: p.src, title: p.title || "", description: "",
      category: p.category, subcategory: p.subcategory || "", is_sample: false,
    }));

export const worksProjects = () =>
  REAL_PROJECTS.filter((p) => p.placements?.includes("works"))
    .map((p) => ({
      id: p.id,
      title: p.title || (p.subcategory || p.practice || ""),
      category:    p.discipline || "interiors",
      subcategory: p.practice   || "",
      location: "", year: "", story: "",
      cover_image: p.src, images: [p.src],
      featured: p.placements.includes("hero"),
      is_sample: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
