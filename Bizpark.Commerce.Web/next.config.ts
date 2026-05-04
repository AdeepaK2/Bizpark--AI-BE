import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Force dynamic rendering — pages rely on runtime tenant context (subdomain/cookie)
  // and cannot be statically pre-rendered at build time.
  output: "standalone",
  experimental: {
    ppr: false,
  },
};

export default nextConfig;
