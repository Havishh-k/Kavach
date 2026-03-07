import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define paths
    const pathname = request.nextUrl.pathname
    const isLoginPage = pathname.startsWith('/login')
    const isAdminRoute = pathname.startsWith('/admin')
    const isGuardRoute = pathname.startsWith('/guard')
    const isRoot = pathname === '/'

    // Redirect root to dashboard or login
    if (isRoot) {
        const url = request.nextUrl.clone()
        if (user) {
            url.pathname = user.user_metadata?.role === 'admin' ? '/admin' : '/guard'
        } else {
            url.pathname = '/login'
        }
        return NextResponse.redirect(url)
    }

    const isProtectedRoute = isAdminRoute || isGuardRoute

    // Not logged in but trying to access a protected route
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Currently logged in user
    if (user) {
        const userRole = user.user_metadata?.role || 'guard' // Default guard if somehow not set

        // Redirect logged-in users away from the login page
        if (isLoginPage) {
            const url = request.nextUrl.clone()
            url.pathname = userRole === 'admin' ? '/admin' : '/guard'
            return NextResponse.redirect(url)
        }

        // RBAC Checks
        if (isAdminRoute && userRole !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/guard'
            return NextResponse.redirect(url)
        }

        if (isGuardRoute && userRole !== 'guard') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
