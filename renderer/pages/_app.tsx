import type { AppProps } from 'next/app'
import { ClerkProvider } from '@clerk/clerk-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MockClerkProvider, isClerkConfigured } from '../lib/clerk-fallback'
import '../styles/global.css'

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''

export default function App({ Component, pageProps }: AppProps) {
    const innerContent = (
        <TooltipProvider delay={100}>
            <Component {...pageProps} />
        </TooltipProvider>
    )

    if (isClerkConfigured) {
        return (
            <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
                {innerContent}
            </ClerkProvider>
        )
    }

    return (
        <MockClerkProvider>
            {innerContent}
        </MockClerkProvider>
    )
}
