import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Violingo",
    short_name: "Violingo",
    description: "A violin practice companion — weekly streaks, lives, and sidequests.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#6b3fa0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
