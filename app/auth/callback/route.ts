import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    // If there's an error from Google, redirect back to login
    if (error) {
        console.error('OAuth error:', error, error_description)
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
        )
    }

    // If there's a code, exchange it for a session
    if (code) {
        try {
            const cookieStore = await cookies()
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll()
                        },
                        setAll(cookiesToSet: any) {
                            try {
                                cookiesToSet.forEach(({ name, value, options }: any) =>
                                    cookieStore.set(name, value, options)
                                )
                            } catch {
                                // Cookie setting might fail in some cases
                            }
                        },
                    },
                }
            )

            const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

            if (sessionError) {
                console.error('Session exchange error:', sessionError)
                return NextResponse.redirect(
                    new URL('/login?error=' + encodeURIComponent(sessionError.message), request.url)
                )
            }

            console.log('Session created successfully:', data.user?.email)

            // Redirect to home page after successful login
            return NextResponse.redirect(new URL('/', request.url))
        } catch (err) {
            console.error('Callback error:', err)
            return NextResponse.redirect(
                new URL('/login?error=Authentication%20failed', request.url)
            )
        }
    }

    // No code or error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
}