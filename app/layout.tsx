import "./globals.css";
import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from "@/components/shared/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Client & Complaint Registry",
  description: "Register clients, manage phone access, and track civic complaints across Maharashtra.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Client Registry",
  },
};

export const viewport: Viewport = {
  themeColor: "#4c1d95",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
