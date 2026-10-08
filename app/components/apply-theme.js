"use client";

import { useEffect } from "react";
import { applyTheme } from "../lib/themes";

export default function ApplyTheme({ theme }) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
