import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

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
  spaces: [
    "Bathroom",
    "Bedroom",
    "Kitchen",
    "Living Room",
    "Dining",
    "Foyer",
    "Study",
    "Balcony",
    "Outdoor",
  ],
  segments: [
    "Furniture",
    "TV Units",
    "Wardrobe",
    "Modular Kitchen",
    "False Ceiling",
    "Lighting",
    "Flooring",
    "Wall Finishes",
    "Doors & Partitions",
  ],
};
