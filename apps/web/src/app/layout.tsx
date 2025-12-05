import "./globals.css";
import "katex/dist/katex.min.css"; // <-- estilos de KaTeX después de globals
import { Noto_Sans, Spline_Sans } from "next/font/google";

import { GlobalLoaderOverlay } from "@/components/GlobalLoaderOverlay";
import NavigationLoadingWrapper from "@/components/NavigationLoadingWrapper";
import { GlobalLoaderProvider } from "@/contexts/GlobalLoaderContext";
import { NavigationProvider } from "@/contexts/NavigationContext";

const notoSans = Noto_Sans({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans",
});

const splineSans = Spline_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-spline-sans",
});

export const metadata = {
  title: "Analizador de Complejidad",
  description: "Análisis avanzado de complejidad algorítmica",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${notoSans.variable} ${splineSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-[#101a23] text-white antialiased"
        style={{
          fontFamily:
            "var(--font-spline-sans), var(--font-noto-sans), sans-serif",
        }}
      >
        <GlobalLoaderProvider>
          <NavigationProvider>
            <NavigationLoadingWrapper>{children}</NavigationLoadingWrapper>
          </NavigationProvider>
          <GlobalLoaderOverlay />
        </GlobalLoaderProvider>
      </body>
    </html>
  );
}
