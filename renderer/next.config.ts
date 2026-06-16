import { NextConfig } from 'next'

const isNextronBuild = process.env.NEXTRON_BUILD === 'true'

const config: NextConfig = {
  output: isNextronBuild ? 'export' : undefined,
  distDir: isNextronBuild ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default config
