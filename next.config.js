/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },

  /* config options here */

  images: {
    domains: [
      "rawpng.com",
      "images-hub-nine.vercel.app",
      "d3pf9vt7kp1xrg.cloudfront.net",
      "d1u0z778tbk6uw.cloudfront.net",
      "rawpngbucket.s3.ap-south-1.amazonaws.com",
      "localhost",
    ],
    unoptimized: false,
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rawpng.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images-hub-nine.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3pf9vt7kp1xrg.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d1u0z778tbk6uw.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rawpngbucket.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  assetPrefix:
    process.env.NODE_ENV === "production" ? "https://rawpng.com" : "",
};

module.exports = nextConfig;
