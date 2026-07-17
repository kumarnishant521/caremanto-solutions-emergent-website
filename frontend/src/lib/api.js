import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

/**
 * Prevents the CRA red runtime-error overlay from showing up whenever an API
 * call happens to fail. We still surface the rejection to the caller (so
 * component code can react to it), but we mark it as `__handled` and swallow
 * unhandled-rejection events at the window level below, so it never bubbles
 * up as an uncaught error.
 */
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error && typeof error === "object") error.__handled = true;
    return Promise.reject(error);
  }
);

if (typeof window !== "undefined" && !window.__caremantoAxiosGuard) {
  window.__caremantoAxiosGuard = true;
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e && e.reason;
    if (reason && reason.__handled) {
      // Silently swallow — component-level `.catch()` already handled it.
      e.preventDefault();
    }
  });
}

export const formatApiError = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const NAV_CATEGORIES = {
  interiors: {
    label: "Interior Projects",
    slug: "interiors",
    items: [
      "Residential",
      "Commercial",
      "Retail Design",
      "Hospitality",
    ],
  },
  restoration: {
    label: "Services · Restoration & Renovation",
    slug: "restoration",
    items: [
      "Restoration & Renovations",
      "Structural Renovations & Facade Renewal",
      "Sound Proofing",
      "Water-Proofing",
      "Heritage Restoration",
      "Modernisation",
    ],
  },
};

export const GALLERY_TAXONOMY = {
  categories: ["RESIDENTIAL", "COMMERCIAL"],
  subcategories: {
    "RESIDENTIAL": ["Bedrooms", "Bathrooms", "Kitchen", "Hall & Dining", "Balcony - Dry Area", "Temple"],
    "COMMERCIAL":  ["Hospitality", "Retail Design", "Office Spaces"],
  },
};
