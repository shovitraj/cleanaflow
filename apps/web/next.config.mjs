/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cleanaglow/db", "@cleanaglow/types", "@cleanaglow/config"]
};

export default nextConfig;
