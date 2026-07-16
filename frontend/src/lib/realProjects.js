/**
 * =============================================================================
 *  CAREMANTO — REAL PROJECT IMAGE REGISTRY
 * =============================================================================
 *  Add one entry per photograph shared by the studio.
 *  Every entry can carry as many placements as needed:
 *    • hero        — cycles in the hero slideshow
 *    • home        — appears in the home page bento gallery
 *    • gallery     — automatically inserted into the /gallery page
 *                    (uses `category` + `subcategory` to slot into the tabs)
 *
 *  Removing the entry immediately removes the image from every placement.
 *  Order in this file = order of appearance on the site.
 * =============================================================================
 */
export const REAL_PROJECTS = [
  {
    id: "cm-2026-001",
    src: "https://customer-assets-v7afamib.emergentagent.net/job_design-restore-pro/artifacts/2thkoaxu_IMG_5301.png",
    title: "Master Bedroom · Curved Cove Ceiling",
    kind: "residential",
    category: "Home Spaces & Corners",
    subcategory: "Bedrooms",
    placements: ["hero", "home", "gallery"],
    // Ken-Burns transform origin used when featured in the hero slideshow
    origin: "center",
  },
];

/* ---------------------------------------------------------------- helpers */

export const heroImages = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("hero"))
    .map((p) => ({ src: p.src, kind: p.kind, origin: p.origin || "center" }));

export const homeGalleryImages = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("home"))
    .map((p) => ({ src: p.src, kind: p.kind, title: p.title }));

export const galleryImages = () =>
  REAL_PROJECTS
    .filter((p) => p.placements?.includes("gallery"))
    .map((p) => ({
      id: p.id,
      image: p.src,
      title: p.title,
      description: "",
      category: p.category,
      subcategory: p.subcategory || "",
      is_sample: false,
    }));
