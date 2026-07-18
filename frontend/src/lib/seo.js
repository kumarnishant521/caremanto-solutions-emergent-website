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
    "Best bungalow interior designer in Mumbai",
    "Best bungalow interior designer near me",
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
    "Best office interior designer near me",
    "Best office interior designers in Mumbai",
    "Best office design company in India",
    "Boutique hospitality styling",
    "Boutique designer",
    "Best boutique designer",
    "Best boutique designer in Mumbai",
    "Best hotel interior designer",
    "Retail store designers",
    "Retail spatial design",
    "Commercial space fit out",
    "Store design",
    "Unique store design",
    "Luxury store design",
    "Best luxury store designer",
    "Best luxury store designing company",
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
// Home / Portfolio surfaces get an explicitly-curated bundle so no
// high-intent phrase is dropped by array reordering. Category surfaces
// get the full bucket for their practice.
const HOME_KEYWORDS_EXTRA = [
  "Free home interior consultation",
  "Free designing consultation",
  "Luxury interior designs",
  "Luxury interior designer near me",
  "Luxury designing in budget",
  "Interior designers near me",
  "Home interior designer",
  "Best bungalow interior designer in Mumbai",
  "Best bungalow interior designer near me",
  "Modular kitchen design",
  "Luxury bedroom designs",
  "Luxury bathroom design",
  "Office interior design",
  "Best office interior designer near me",
  "Best office interior designers in Mumbai",
  "Best office design company in India",
  "Retail store designers",
  "Best luxury store designer",
  "Best luxury store designing company",
  "Boutique hospitality styling",
  "Best boutique designer",
  "Best boutique designer in Mumbai",
  "Turnkey commercial design execution",
  "Luxury showroom interior design",
  "Home renovation",
  "Bungalow restoration",
  "Heritage architectural restoration",
  "Structural renovations contractors",
  "Building waterproofing and repair",
  "All in one contractor near me",
];

export function keywordsFor({ category, folder } = {}) {
  const base = [...KEYWORDS.brand];
  if (category === "RESIDENTIAL") base.push(...KEYWORDS.residential);
  else if (category === "COMMERCIAL") base.push(...KEYWORDS.commercial);
  else if (category === "RESTORATION & RENOVATIONS") base.push(...KEYWORDS.restoration);
  else {
    // Home / Portfolio — explicit curated bundle guarantees every
    // high-intent phrase is present (avoids array-slice truncation).
    base.push(...HOME_KEYWORDS_EXTRA);
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
