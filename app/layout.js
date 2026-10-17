import "./globals.css";
import ThemeInit from "./components/theme-init";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "./lib/themes";

// Root layout component for the application, including global styles and theme initialization.

export const metadata = {
  title: "Portfolio Forge - Freemium Portfolio Builder",
  description:
    "Build a portfolio, import GitHub projects, and upgrade to Pro when you need more control.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        data-theme-default={DEFAULT_THEME}
        data-theme-storage-key={THEME_STORAGE_KEY}
      >
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
