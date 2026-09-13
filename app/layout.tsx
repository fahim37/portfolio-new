import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const themeInitializationScript = `
  (function () {
    try {
      var storedTheme = localStorage.getItem("fahim-portfolio-theme");
      var theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      var themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#101211" : "#fcfcfc");
    } catch (_) {}
  })();
`;

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const siteTitle = "Fahim Ahmed Emon | Full Stack Developer & Team Lead";
const siteDescription =
  "Portfolio of Fahim Ahmed Emon, a full stack developer and team lead building production web, mobile, cloud and AI products.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  authors: [{ name: "Fahim Ahmed Emon" }],
  openGraph: { type: "website", title: siteTitle, description: siteDescription },
  twitter: { card: "summary", title: siteTitle, description: siteDescription },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#fcfcfc" />
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
