import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Violingo",
    short_name: "Violingo",
    description: "A violin practice companion — weekly streaks, lives, and sidequests.",
    start_url: "/",
    display: "standalone",
    // Prototype palette for now; the rebrand phase swaps these with the icons.
    background_color: "#eafff1",
    theme_color: "#2fbf71",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
