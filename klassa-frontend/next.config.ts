import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // localhost permitido por defecto; agrega IP(s) de red local para dev
  allowedDevOrigins: ['192.168.18.58', '192.168.18.*'],
};

export default nextConfig;
