/**
 * Caremanto Solutions — Central SEO utilities.
 *
 * One place to control:
 *   • The 72 studio-approved keywords, indexed per category.
 *   • Dynamic per-folder <title> generation (browser tab).
 *   • Keyword-rich, folder-aware alt-text for every photograph.
 *   • Semantic anchor-text for navigation CTAs (Google internal-linking
 *     authority signal).
 */

const BRAND = "Caremanto Solutions";

// ---------------------------------------------------------- KEYWORD MAP
// Grouped so pages can pull the tightest bundle of high-intent phrases for
// their surface. Every phrase from the studio's approved list appears in
// at least one bucket. Duplicates across buckets are intentional — Google
// weights per-page density.

export const KEYWORDS = {
  brand: [
    "Caremanto Solutions",
    "Best interior designers in Mumbai",
    "Top designer firms in Mumbai",
    "Best designer company in India",
    "Best designing company in Mumbai",
    "Most reliable interior firm",
    "Most reliable interior designer near me",
    "Most reliable interior company",
    "All in one contractor near me",
    "Interior designers near me",
  ],

  residential: [
    "Luxury interior designs",
    "Luxury interior designer near me",
    "Home interior designer",
    "Best home interiors",
    "Best house design",
    "Best bungalow interior firm",
    "Best outhouse designer",
    "Unique house ideas",
    "Unique home design",
    "Unique bedroom designs",
    "Modular kitchen design",
    "Modular bathroom design",
    "Bedroom design",
    "Luxury bedroom designs",
    "Hall design",
    "Living room design",
    "Luxury living room design",
    "Bathroom design",
    "Luxury bathroom design",
    "Balcony renovations",
    "Temple designs",
    "Interiors studio",
    "Luxury designing in budget",
    "Budgeted renovations",
    "Fast interiors",
    "Free home interior consultation",
    "Free designing consultation",
  ],

  commercial: [
    "Office interior design",
    "Modern office layout",
    "Boutique hospitality styling",
    "Boutique designer",
    "Best hotel interior designer",
    "Retail store designers",
    "Retail spatial design",
    "Commercial space fit out",
    "Store design",
    "Unique store design",
    "Luxury store design",
    "Turnkey commercial design execution",
    "Turnkey contractor",
    "Luxury showroom interior design",
  ],

  restoration: [
    "Home repair",
    "Home renovation",
    "Bungalow repairs",
    "Bungalow restoration",
    "Best bungalow repairing company",
    "Old property renovation",
    "Old property repairs",
    "Old property restoration",
    "Heritage architectural restoration",
    "Heritage architectural repairs",
    "Structural renovations contractors",
    "Building waterproofing and repair",
    "Terrace waterproofing and repair",
    "Swimming pool and basement structural repairs",
    "Leakage and seepage repair",
    "Commercial building repair",
    "Commercial building rehabilitation",
    "Fast renovations",
    "Quick repairs",
    "Quick interiors and renovations",
  ],
};

// ---------------------------------------------------------- FOLDER TITLES
// Per-folder dynamic <title> tags. The Gemini brief specified this exact
// format: "<Folder Semantics> | CAREMANTO SOLUTIONS".

const FOLDER_TITLES = {
  // Residential sub-folders
  "Hall & Dining":          "Luxury Hall & Living Room Design",
  "Bedrooms":               "Luxury Bedroom Design & Interior Architecture",
  "Bathrooms":              "Luxury Bathroom Design & Modular Bathroom Interiors",
  "Kitchens":               "Modular Kitchen Design & Luxury Kitchen Interiors",
  "Balcony / Dry Area / Temple": "Balcony Renovations & Temple Design",

  // Commercial sub-folders
  "Office spaces":          "Office Interior Design & Modern Office Layout",
  "Retail Design":          "Retail Store Design & Retail Spatial Optimisation",
  "Hospitality":            "Boutique Hospitality Styling & Hotel Interior Design",
};

export function pageTitleFor({ category, folder } = {}) {
  if (folder && FOLDER_TITLES[folder]) {
    return `${FOLDER_TITLES[folder]} | ${BRAND.toUpperCase()}`;
  }
  if (category === "RESIDENTIAL") {
    return `Luxury Residential Interior Design Portfolio | ${BRAND.toUpperCase()}`;
  }
  if (category === "COMMERCIAL") {
    return `Turnkey Commercial Design & Office Fit-out Portfolio | ${BRAND.toUpperCase()}`;
  }
  if (category === "RESTORATION & RENOVATIONS") {
    return `Heritage Restoration, Structural Renovation & Building Repairs | ${BRAND.toUpperCase()}`;
  }
  return `Luxury Interior Design, Renovation & Restoration Studio · Mumbai | ${BRAND.toUpperCase()}`;
}

// ---------------------------------------------------------- KEYWORDS FOR ROUTE
export function keywordsFor({ category, folder } = {}) {
  const base = [...KEYWORDS.brand];
  if (category === "RESIDENTIAL") base.push(...KEYWORDS.residential);
  else if (category === "COMMERCIAL") base.push(...KEYWORDS.commercial);
  else if (category === "RESTORATION & RENOVATIONS") base.push(...KEYWORDS.restoration);
  else {
    // Home / Portfolio — a curated top slice across every practice
    base.push(
      ...KEYWORDS.residential.slice(0, 8),
      ...KEYWORDS.commercial.slice(0, 6),
      ...KEYWORDS.restoration.slice(0, 6),
    );
  }
  // Dedupe while preserving order.
  return Array.from(new Set(base)).join(", ");
}

// ---------------------------------------------------------- ALT TEXT
// Keyword-rich, folder-aware alt-text for every photograph. Never a bare
// filename. Google image-search + accessibility both win.

const ALT_BY_FOLDER = {
  "Hall & Dining":          "Luxury hall and dining room interior architecture",
  "Bedrooms":               "Premium luxury bedroom interior architecture",
  "Bathrooms":              "Luxury bathroom interior design and modular bathroom",
  "Kitchens":               "Modular kitchen interior design and luxury kitchen architecture",
  "Balcony / Dry Area / Temple": "Balcony, dry area and temple interior design",
  "Office spaces":          "Modern office interior design and workplace layout",
  "Retail Design":          "Retail store design and luxury showroom interior",
  "Hospitality":            "Boutique hospitality interior design and hotel styling",
};

const ALT_BY_CATEGORY = {
  "RESIDENTIAL":              "Luxury residential interior architecture",
  "COMMERCIAL":               "Turnkey commercial interior fit-out",
  "RESTORATION & RENOVATIONS": "Heritage restoration and structural renovation",
};

export function altFor(photo, index = 0) {
  if (!photo) return `Caremanto Solutions luxury interior photography — Mumbai`;
  const folder = photo.subcategory && ALT_BY_FOLDER[photo.subcategory];
  const category = ALT_BY_CATEGORY[photo.category] || "Luxury interior design";
  const title = photo.title || "";
  const parts = [];
  if (folder) parts.push(folder);
  else parts.push(category);
  if (title) parts.push(`— ${title}`);
  parts.push(`by ${BRAND} Mumbai`);
  return parts.join(" ");
}

// ---------------------------------------------------------- ANCHOR TEXT
// Semantic anchors — Gemini brief: instead of "View Project" use
// "Explore Luxury Residential Portfolio", etc.

export const ANCHORS = {
  homeToPortfolio: "Explore the Full Luxury Interior Design Portfolio",
  homeToWorks:     "Browse Residential, Commercial & Restoration Projects",
  homeToConsult:   "Book a Free Home Interior Consultation",

  residential:    "Explore Luxury Residential Portfolio",
  commercial:     "View Commercial Layout & Fit-out Execution",
  restoration:    "Discover Heritage Restoration & Renovation Projects",

  browseGallery:  "Browse the Full Interior Design Gallery",
  fullPortfolio:  "See Every Curated Studio Commission",
  bookConsult:    "Book a Free Design Consultation with the Studio",
  begin:          "Begin a Conversation with the Studio",
};
