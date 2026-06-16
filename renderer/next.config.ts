import { NextConfig } from 'next'

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL

const config: NextConfig = {
  output: (process.env.NODE_ENV === 'production' && !isVercel) ? 'export' : undefined,
  distDir: (process.env.NODE_ENV === 'production' && !isVercel) ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default config
