"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  applyTheme,
  getThemeOptions,
  THEME_STORAGE_KEY,
} from "./themes";

const THEME_CHANGE_EVENT = "portfolio-theme-change";

function getThemeSnapshot() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return getThemeOptions().some((theme) => theme.value === savedTheme)
    ? savedTheme
    : "purple";
}

function getServerThemeSnapshot() {
  return "purple";
}

function subscribeToTheme(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function saveTheme(theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

// Tema je jedino što ostaje u localStorage, da se primeni bez treptanja.
export function useTheme() {
  const selectedTheme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const themes = useMemo(() => getThemeOptions(), []);

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  return { themes, selectedTheme, saveTheme };
}
