import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Smart Academic Scheduler",
    template: "%s | Smart Academic Scheduler",
  },
  description:
    "A university-grade scheduling platform built toward Next.js, TypeScript, Tailwind, and AI-assisted academic operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-[#142622] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
