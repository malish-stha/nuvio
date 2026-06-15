import type { AppProps } from 'next/app'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
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
            <ClerkProvider 
                publishableKey={CLERK_PUBLISHABLE_KEY}
                appearance={{
                    baseTheme: dark,
                    variables: {
                        colorPrimary: '#5865F2',
                        colorBackground: '#0f131f',
                        colorInputBackground: '#161c2e',
                        colorInputText: '#f3f4f6',
                    }
                }}
            >
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
