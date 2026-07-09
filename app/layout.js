import "./globals.css";

export const metadata = {
  title: "Dev Portfolio",
  description: "Personal developer portfolio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
