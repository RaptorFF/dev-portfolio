"use client";

import { useEffect } from "react";
import { applyTheme, THEME_STORAGE_KEY } from "../lib/themes";

export default function ThemeInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(savedTheme || "purple");
  }, []);

  return null;
}
