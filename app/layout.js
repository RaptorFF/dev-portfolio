import "./globals.css";

export const metadata = {
  title: "Portfolio Forge - Freemium Portfolio Builder",
  description:
    "Build a portfolio, import GitHub projects, and upgrade to Pro when you need more control.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
