
import { NextRequest, NextResponse } from "next/server"
import { auth } from "./lib/auth/auth"

export default auth((req: NextRequest) => {
    const { nextUrl } = req

    if (nextUrl.pathname === '/api/status') {
        return NextResponse.next(); // allow test route
    }

    const isLoggedIn = !!req.auth


    const isAuthPage = nextUrl.pathname.startsWith("/login")
    const isPublicPage = nextUrl.pathname === "/" || isAuthPage

    if (!isAuthPage && nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    // Redirect non-logged-in users to sign-in page
    if (!isLoggedIn && !isPublicPage) {
        return NextResponse.redirect(new URL("/login", nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],

}