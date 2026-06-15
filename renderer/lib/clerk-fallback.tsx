import React from 'react'

// Check if Clerk publishable key is present in env variables
export const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

interface ClerkMockContext {
    user: {
        id: string
        fullName: string
        primaryEmailAddress: string
        imageUrl: string
    } | null
    signOut: () => void
}

const ClerkContext = React.createContext<ClerkMockContext>({
    user: null,
    signOut: () => { },
})

export function MockClerkProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<any>(null)

    // Auto-login a default developer mock user
    React.useEffect(() => {
        setUser({
            id: 'mock-user-12345',
            fullName: 'Admin User',
            primaryEmailAddress: 'admin@nuvio.dev',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80',
        })
    }, [])

    const signOut = () => {
        setUser(null)
    }

    return (
        <ClerkContext.Provider value={{ user, signOut }}>
            {user ? (
                children
            ) : (
                <div className="flex h-screen w-screen bg-[#070a12] text-foreground items-center justify-center">
                    <div className="p-8 border border-border rounded-2xl bg-card max-w-sm text-center">
                        <p className="text-sm font-bold text-rose-500 mb-2">Guest Signed Out</p>
                        <button
                            onClick={() =>
                                setUser({
                                    id: 'mock-user-12345',
                                    fullName: 'Admin User',
                                    primaryEmailAddress: 'admin@nuvio.dev',
                                    imageUrl: '',
                                })
                            }
                            className="px-4 py-2 bg-primary rounded-xl text-xs font-semibold text-primary-foreground"
                        >
                            Sign In Demo Guest
                        </button>
                    </div>
                </div>
            )}
        </ClerkContext.Provider>
    )
}

export const useMockUser = () => React.useContext(ClerkContext)
