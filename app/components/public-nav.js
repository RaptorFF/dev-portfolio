"use client";

import { Children, useEffect, useRef, useState } from "react";

const SCROLL_ON = 120;
const SCROLL_OFF = 60;

export default function PublicNav({ children }) {
  const headerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Inside the dashboard preview the page scrolls in a container, not the window.
    const container = headerRef.current?.closest("[data-scroll-container]");
    const target = container ?? window;
    const onScroll = () => {
      const y = container ? container.scrollTop : window.scrollY;
      setScrolled((prev) => (prev ? y > SCROLL_OFF : y > SCROLL_ON));
    };
    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
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
      ref={headerRef}
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
