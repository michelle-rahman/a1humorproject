'use client';

import { createClient } from '@/lib/supabase-client';

export default function LoginPage() {
    const handleGoogleLogin = async () => {
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>Login</h1>
            <button
                onClick={handleGoogleLogin}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Sign in with Google
            </button>
        </main>
    );
}