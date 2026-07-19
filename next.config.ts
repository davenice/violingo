import type { NextConfig } from "next";

// Static export for GitHub Pages (app is fully client-side; Firebase is the
// backend). trailingSlash makes every route a folder/index.html, which Pages
// serves natively. Custom headers aren't possible on Pages — the service
// worker registration compensates with updateViaCache: "none".
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
