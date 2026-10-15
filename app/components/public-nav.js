"use client";

import { useEffect, useState } from "react";

const SCROLL_ON = 120;
const SCROLL_OFF = 60;

export default function PublicNav({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > SCROLL_OFF : y > SCROLL_ON));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`public-nav${scrolled ? " is-scrolled" : ""}`}>
      {children}
    </header>
  );
}
