import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Falcon Strategy Trading Terminal",
  description: "Automated Algorithmic Trading Platform - Falcon Strategy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased selection:bg-cyanAccent selection:text-black">
        {children}
      </body>
    </html>
  );
}
