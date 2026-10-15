"use client";

import { Children, useEffect, useState } from "react";

const SCROLL_ON = 120;
const SCROLL_OFF = 60;

export default function PublicNav({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > SCROLL_OFF : y > SCROLL_ON));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth > 800 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const [brand, ...menuItems] = Children.toArray(children);

  return (
    <header
      className={`public-nav${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}
    >
      {brand}
      <button
        type="button"
        className="public-nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="public-nav-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <div
        id="public-nav-menu"
        className="public-nav-menu"
        onClick={(e) => e.target.closest("a") && setOpen(false)}
      >
        {menuItems}
      </div>
    </header>
  );
}
