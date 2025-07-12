import { auth } from '@/lib/auth'
import React from 'react'

export default async function page() {
    const session = await auth()
    console.log(session.user);

    return (
        <div>page</div>
    )
}
