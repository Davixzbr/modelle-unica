import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "bypxikshofvbnmbsatod.supabase.co" }],
  },
};

export default nextConfig;
