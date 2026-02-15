import "./globals.css";
import "katex/dist/katex.min.css";
import { Noto_Sans, Spline_Sans } from "next/font/google";

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
        {children}
      </body>
    </html>
  );
}
