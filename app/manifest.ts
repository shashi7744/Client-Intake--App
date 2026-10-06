import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maharashtra Police Boy sanghatna",
    short_name: "Police Boy Sanghatna",
    description: "Maharashtra Police Boy sanghatna - Member registration, civic intake, and complaints portal.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4c1d95",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
