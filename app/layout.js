import "./globals.css";
import ThemeInit from "./components/theme-init";
import { THEME_STORAGE_KEY, themeOptions } from "./lib/themes";

export const metadata = {
  title: "Portfolio Forge - Freemium Portfolio Builder",
  description:
    "Build a portfolio, import GitHub projects, and upgrade to Pro when you need more control.",
};

export default function RootLayout({ children }) {
  const initialTheme = Object.keys(themeOptions)[0];

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        data-theme-default={initialTheme}
        data-theme-storage-key={THEME_STORAGE_KEY}
      >
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
