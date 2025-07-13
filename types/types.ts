export interface Session {
    user: {
        id: string
        email: string
        role: string
        zone?: string
        branch?: string
    },
    expires: string

}

export interface User {
    id: string
    email: string
    role: string
    zone?: string
    branch?: string
}