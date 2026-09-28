import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aido — NGX Investment Intelligence",
  description: "Don't just know what the market is doing. Know what it means for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
