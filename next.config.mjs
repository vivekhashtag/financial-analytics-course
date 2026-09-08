/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Content lives outside app/ and is read with fs at build time.
  outputFileTracingIncludes: {
    '/**': ['./content/**/*', './data/**/*', './schema/**/*'],
  },
};

export default nextConfig;
