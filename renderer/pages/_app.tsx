import type { AppProps } from 'next/app'
import { TooltipProvider } from '@/components/ui/tooltip'
import '../styles/global.css'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <TooltipProvider delay={100}>
            <Component {...pageProps} />
        </TooltipProvider>
    )
}
