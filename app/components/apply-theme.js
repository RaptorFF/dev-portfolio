"use client";

import { useEffect } from "react";
import { applyTheme } from "../lib/themes";

// Component to apply a given theme using the applyTheme function from the themes library
export default function ApplyTheme({ theme }) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
