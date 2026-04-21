import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Academic Scheduler",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
