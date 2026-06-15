import { NextConfig } from 'next'

const config: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default config
