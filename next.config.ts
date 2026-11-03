import type { NextConfig } from "next";

// Single-user tool whose every page reads live data: no component caching, no prefetch heuristics.
const nextConfig: NextConfig = {
  agentRules: false,
};

export default nextConfig;
