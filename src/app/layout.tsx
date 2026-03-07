import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "BASeD Command Center",
  description: "Barnett Automated Services & Digital Operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <div className="grid-bg" />
        <div className="scanlines" />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
