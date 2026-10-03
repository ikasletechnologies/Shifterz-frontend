import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/vehicle-inspection",
        destination: "/dashboard/vehicle-inspection",
        permanent: false,
      },
      {
        source: "/qc",
        destination: "/dashboard/qc",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
