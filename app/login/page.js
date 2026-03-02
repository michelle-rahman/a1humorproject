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
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '60px 40px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }}>
                <h1 style={{
                    color: '#000',
                    marginBottom: '10px',
                    fontSize: '32px',
                    fontWeight: 'bold'
                }}>
                    Humor Project
                </h1>

                <p style={{
                    color: '#666',
                    marginBottom: '30px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                }}>
                    Upload images and generate hilarious captions powered by AI. Vote on your favorite captions!
                </p>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        padding: '14px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(33,150,243,0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1976D2';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(33,150,243,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2196F3';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(33,150,243,0.3)';
                    }}
                >
                    🔐 Sign in with Google
                </button>

                <p style={{
                    color: '#999',
                    marginTop: '20px',
                    fontSize: '12px'
                }}>
                    We never store your password. Sign in securely with Google.
                </p>
            </div>
        </main>
    );
}