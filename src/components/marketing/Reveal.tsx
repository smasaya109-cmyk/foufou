"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "up" | "left" | "right" | "scale";
  as?: "div" | "section" | "footer";
};

export default function Reveal({
  children,
  className = "",
  delayMs = 0,
  variant = "up",
  as = "div"
}: Props) {
  const Tag = as;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`lp-reveal lp-reveal--${variant} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
