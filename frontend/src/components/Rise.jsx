import { useEffect, useRef, useState } from "react";

/** Fires `in` class on child when scrolled into view once. */
export function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function Rise({ children, delay = 0, className = "", as: As = "div" }) {
  const { ref, inView } = useInView();
  return (
    <As
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`rise ${inView ? "in" : ""} ${className}`}
    >
      {children}
    </As>
  );
}
