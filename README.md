# Nuvio

A real-time desktop collaboration platform built with Next.js, Electron, Prisma, and WebRTC.

## Tech Stack
- **Desktop Framework**: Electron & Nextron (Next.js 16)
- **Database**: PostgreSQL (Neon) & Prisma ORM
- **Cache**: Upstash Redis
- **Real-time Sync**: Pusher Channels
- **Authentication**: Clerk

## Local Development

### 1. Configure Environment
Create a `.env` file inside the `renderer/` folder:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
PUSHER_APP_ID="..."
NEXT_PUBLIC_PUSHER_APP_KEY="..."
PUSHER_SECRET="..."
NEXT_PUBLIC_PUSHER_CLUSTER="..."
```

### 2. Start Dev Mode
```bash
npm install
npm run dev
```

## Production & Deployment

Because this is an Electron app with server-side Next.js API routes, the project uses a dual build configuration:

### 1. Deploying the Backend (Vercel)
Deploy your repository to Vercel to host the API routes as serverless functions.
- **Root Directory**: `.` (project root)
- **Build Command**: `npm run vercel-build` (runs `prisma generate` and builds the Next.js renderer)
- **Output Directory**: `renderer/.next`

### 2. Packaging the Desktop App
Package the application locally for distribution:
```bash
# Build for host OS (macOS on Mac)
npm run build

# Cross-compile for Windows (.exe Setup installer)
NEXTRON_BUILD=true npx nextron build --win
```
The output binaries will be placed in the `/dist` directory.
