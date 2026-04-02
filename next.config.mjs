/** @type {import('next').NextConfig} */
const supabaseUrl = 'mnqyhezjqzlokxboimmm.supabase.co';

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: lh3.googleusercontent.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    connect-src 'self' https://${supabaseUrl} wss://${supabaseUrl} https://vitals.vercel-analytics.com https://region1.google-analytics.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim(); // Cleans up whitespace


const nextConfig = {
    images: {
      remotePatterns: [
        {
            protocol: 'https',
            hostname: 'lh3.googleusercontent.com',
        },
    ],
        domains: ['lh3.googleusercontent.com'],
    },
    async headers() {
      return [
          {
              source: '/(.*)',
              headers: [
                  {
                      key: 'Content-Security-Policy',
                      value: cspHeader,
                  },
              ],
          },
      ];
  },
    webpack: (config) => {
        config.module.rules.push({
          test: /\.json$/,
          type: 'json',
        });
        return config;
      },
};

export default nextConfig;
