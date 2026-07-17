import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { api } from "../lib/api";

const DEFAULT_ITEMS = ["INTERIORS", "RESTORATION", "REDEFINING SPACES", "SERVICES"];

/**
 * Editorial marquee — reads its item list from the backend covers config so
 * the studio can edit the ticker from the admin without touching code.
 * Falls back to the default set if the fetch fails.
 */
export default function EditorialMarquee() {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    api.get("/covers")
      .then((r) => {
        const list = Array.isArray(r.data?.marquee_items) ? r.data.marquee_items.filter(Boolean) : [];
        if (list.length) setItems(list);
      })
      .catch(() => {});
  }, []);

  return (
    <section
      data-testid="marquee-section"
      className="relative border-y border-[var(--line)] bg-[var(--bg-0)] py-6 md:py-8 overflow-hidden"
    >
      <Marquee speed={38} gradient={false} pauseOnHover>
        {items.map((t, i) => (
          <span key={i} className="marquee-slot">
            <span className="marquee-item">{t}</span>
            <span className="marquee-dot" aria-hidden="true">✦</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
