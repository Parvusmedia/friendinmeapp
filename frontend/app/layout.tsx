import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const dm = DM_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f5",
};

export const metadata: Metadata = {
  title: "FriendInMe — Adopción con corazón y cabeza",
  description:
    "Conectamos adoptantes y refugios con compatibilidad real, no solo por raza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className={dm.className}>
        <SiteHeader />
        <main className="main-shell">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
