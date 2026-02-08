"use client";

import type { ReactNode } from "react";

type NavIconName = "home" | "pricing" | "guide" | "profile";

function IconWrapper({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center ${className ?? ""}`}>
      {children}
    </span>
  );
}

export default function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const common = "stroke-current";
  switch (name) {
    case "home":
      return (
        <IconWrapper className={className}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={common}>
            <path d="M3 10.5L12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" />
          </svg>
        </IconWrapper>
      );
    case "pricing":
      return (
        <IconWrapper className={className}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={common}>
            <path d="M3 12l7.5-7.5H20l1 1v9.5L13.5 22 3 12z" />
            <circle cx="16.5" cy="7.5" r="1.5" />
          </svg>
        </IconWrapper>
      );
    case "guide":
      return (
        <IconWrapper className={className}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={common}>
            <path d="M4 5h12a3 3 0 013 3v11H7a3 3 0 00-3 3V5z" />
            <path d="M7 5v14" />
          </svg>
        </IconWrapper>
      );
    case "profile":
      return (
        <IconWrapper className={className}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={common}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c2.5-4 13.5-4 16 0" />
          </svg>
        </IconWrapper>
      );
    default:
      return <IconWrapper className={className} />;
  }
}
