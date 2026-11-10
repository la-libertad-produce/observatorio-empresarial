import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // exceljs y postgres se ejecutan solo en el servidor
  serverExternalPackages: ['exceljs', 'postgres', 'bcryptjs'],
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
