"use client";

import { useEffect } from "react";
import { applyTheme, DEFAULT_THEME, THEME_STORAGE_KEY } from "../lib/themes";

// Component to initialize the theme based on saved preference or default theme
export default function ThemeInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(savedTheme || DEFAULT_THEME);
  }, []);

  return null;
}
