declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            role: string
            zone?: string
            branch?: string
        }
    }

    interface User {
        id: string
        email: string
        role: string
        zone?: string
        branch?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
        zone?: string
        branch?: string
    }
}
