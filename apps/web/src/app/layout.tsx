import "./globals.css";
import { GlobalLoaderOverlay } from "@/components/GlobalLoaderOverlay";
import { GlobalLoaderProvider } from "@/contexts/GlobalLoaderContext";

export const metadata = {
  title: "Analizador de Complejidad",
  description: "Análisis avanzado de complejidad algorítmica",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?display=swap&family=Noto+Sans:wght@400;500;700;900&family=Spline+Sans:wght@400;500;700"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-[#101a23] text-white antialiased"
        style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
      >
        <GlobalLoaderProvider>
          {children}
          <GlobalLoaderOverlay />
        </GlobalLoaderProvider>
      </body>
    </html>
  );
}
