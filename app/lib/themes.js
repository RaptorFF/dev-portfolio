export const THEME_STORAGE_KEY = "portfolio-forge-theme";

export const themeOptions = {
  purple: {
    label: "Purple glow",
    pageBg: "#090b10",
    panelBg: "rgba(14, 17, 25, 0.78)",
    panelBorder: "rgba(255, 255, 255, 0.1)",
    text: "#f3efe7",
    muted: "rgba(243, 239, 231, 0.72)",
    accent: "#f4c84f",
    accentSoft: "rgba(244, 200, 79, 0.18)",
    shadow: "0 24px 80px rgba(0, 0, 0, 0.42)",
    bodyBackground:
      "radial-gradient(circle at top, rgba(199, 156, 255, 0.06), transparent 28%), radial-gradient(circle at 20% 20%, rgba(140, 94, 255, 0.08), transparent 26%), linear-gradient(180deg, #080611 0%, #05070b 46%, #030409 100%)",
    accentGradient: "linear-gradient(135deg, #d7b4ff, #7c63ff)",
  },
  indigo: {
    label: "Indigo breeze",
    pageBg: "#071225",
    panelBg: "rgba(10, 21, 37, 0.78)",
    panelBorder: "rgba(159, 196, 255, 0.2)",
    text: "#f5f9ff",
    muted: "rgba(232, 241, 255, 0.75)",
    accent: "#84c4ff",
    accentSoft: "rgba(132, 196, 255, 0.2)",
    shadow: "0 24px 80px rgba(2, 10, 24, 0.38)",
    bodyBackground:
      "radial-gradient(circle at top, rgba(95, 138, 255, 0.16), transparent 30%), radial-gradient(circle at 18% 20%, rgba(73, 161, 255, 0.15), transparent 26%), linear-gradient(180deg, #071225 0%, #020917 46%, #01050d 100%)",
    accentGradient: "linear-gradient(135deg, #8ed8ff, #4367ff)",
  },
  slate: {
    label: "Slate echo",
    pageBg: "#121822",
    panelBg: "rgba(17, 24, 39, 0.78)",
    panelBorder: "rgba(255, 255, 255, 0.12)",
    text: "#f4f7fb",
    muted: "rgba(240, 245, 250, 0.74)",
    accent: "#8ecab8",
    accentSoft: "rgba(142, 202, 184, 0.18)",
    shadow: "0 24px 80px rgba(2, 6, 12, 0.4)",
    bodyBackground:
      "radial-gradient(circle at top, rgba(126, 153, 184, 0.12), transparent 26%), radial-gradient(circle at 18% 18%, rgba(77, 109, 139, 0.14), transparent 24%), linear-gradient(180deg, #101722 0%, #0a1018 46%, #060910 100%)",
    accentGradient: "linear-gradient(135deg, #b8e7db, #4f8b87)",
  },
};

export function getThemeOptions() {
  return Object.entries(themeOptions).map(([value, config]) => ({
    value,
    ...config,
  }));
}

export function applyTheme(themeId) {
  if (typeof window === "undefined") return;

  const theme = themeOptions[themeId] || themeOptions.purple;
  const root = document.documentElement;

  root.style.setProperty("--page-bg", theme.pageBg);
  root.style.setProperty("--panel-bg", theme.panelBg);
  root.style.setProperty("--panel-border", theme.panelBorder);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--shadow", theme.shadow);
  root.style.setProperty("--body-bg", theme.bodyBackground);
  root.style.setProperty("--accent-gradient", theme.accentGradient);
}
