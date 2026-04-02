/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '**',
            },
        ],
    },
    // Next.js 15 handles JSON out of the box, 
    // unless you have highly specific non-standard JSON requirements.
};

export default nextConfig;