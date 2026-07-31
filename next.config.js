/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.shopee.com.br" },
      { protocol: "https", hostname: "**.susercontent.com" },
      { protocol: "https", hostname: "**.shopeemobile.com" },
      { protocol: "https", hostname: "**.mlstatic.com" },
      { protocol: "https", hostname: "**.media-amazon.com" },
    ],
  },
};

module.exports = nextConfig;
