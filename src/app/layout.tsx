import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BASeD Command Center",
  description: "Barnett Advisory Services & Enterprise Development — Command Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
