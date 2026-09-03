"use client";

import { useEffect, useRef } from "react";

/** Revela elementos .reveal ao rolar (fade-in suave). `delayMs` p/ stagger. */
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "header";
  delayMs?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={`reveal ${className}`} style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}>
      {children}
    </Tag>
  );
}
