import { useEffect } from "react";

/**
 * Head — dependency-free per-route SEO controller.
 *
 * Sets `<title>`, `meta[name=description]`, `link[rel=canonical]`,
 * `og:*` and `twitter:*` tags directly on `document.head` when a page
 * mounts. Restores the previous values on unmount so navigating back
 * to the home page (or SPA transitions) doesn't leak the last route's
 * metadata to crawlers hitting the cached DOM.
 *
 * Doesn't depend on react-helmet — one less runtime dependency.
 */

function upsertMeta({ name, property, content }) {
  if (content == null) return () => {};
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let el = document.head.querySelector(selector);
  const created = !el;
  const previous = el ? el.getAttribute("content") : null;
  if (!el) {
    el = document.createElement("meta");
    if (name) el.setAttribute("name", name);
    if (property) el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return () => {
    if (created) el.remove();
    else if (previous != null) el.setAttribute("content", previous);
  };
}

function upsertLink({ rel, href }) {
  if (!href) return () => {};
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  const created = !el;
  const previous = el ? el.getAttribute("href") : null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return () => {
    if (created) el.remove();
    else if (previous != null) el.setAttribute("href", previous);
  };
}

export default function Head({
  title,
  description,
  canonical,
  image,
  keywords,
  ogType = "website",
}) {
  useEffect(() => {
    const cleanups = [];
    const previousTitle = document.title;

    if (title) document.title = title;

    if (description) {
      cleanups.push(upsertMeta({ name: "description", content: description }));
      cleanups.push(upsertMeta({ property: "og:description", content: description }));
      cleanups.push(upsertMeta({ name: "twitter:description", content: description }));
    }
    if (title) {
      cleanups.push(upsertMeta({ property: "og:title", content: title }));
      cleanups.push(upsertMeta({ name: "twitter:title", content: title }));
    }
    if (image) {
      cleanups.push(upsertMeta({ property: "og:image", content: image }));
      cleanups.push(upsertMeta({ name: "twitter:image", content: image }));
    }
    if (ogType) {
      cleanups.push(upsertMeta({ property: "og:type", content: ogType }));
    }
    if (keywords) {
      cleanups.push(upsertMeta({ name: "keywords", content: keywords }));
    }
    if (canonical) {
      cleanups.push(upsertLink({ rel: "canonical", href: canonical }));
      cleanups.push(upsertMeta({ property: "og:url", content: canonical }));
    }

    return () => {
      if (title) document.title = previousTitle;
      cleanups.forEach((fn) => fn && fn());
    };
  }, [title, description, canonical, image, keywords, ogType]);

  return null;
}
