import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // localhost permitido por defecto; agrega IP(s) de red local para dev
  allowedDevOrigins: ['192.168.18.58', '192.168.18.*'],
  experimental: {
    serverActions: {
      // Match backend's multipart.max-file-size (application.yml) — default
      // 1MB would silently reject student photos the backend would accept.
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
