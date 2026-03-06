'use client';

import { createClient } from '@/lib/supabase-client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

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
            alert('Login failed: ' + error.message);
        }
    };

    return (
        <main style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            padding: '0',
            position: 'relative'
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'fixed',
                top: '10%',
                right: '10%',
                width: '400px',
                height: '400px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                animation: 'float 8s ease-in-out infinite',
                zIndex: 0
            }} />
            <div style={{
                position: 'fixed',
                bottom: '5%',
                left: '5%',
                width: '350px',
                height: '350px',
                background: 'rgba(76,175,80,0.1)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                animation: 'float 10s ease-in-out infinite',
                zIndex: 0
            }} />

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '40px',
                    animation: 'slideDown 0.8s ease-out'
                }}>
                    {/* Animated Logo */}
                    <div style={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        margin: '20px 0'
                    }}>
                        <div style={{
                            fontSize: '100px',
                            animation: 'bounce 3s ease-in-out infinite',
                            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                        }}>
                            🎬
                        </div>
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            fontSize: '40px',
                            animation: 'spin 4s linear infinite'
                        }}>
                            ⭐
                        </div>
                    </div>

                    {/* Main Title */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <h1 style={{
                            fontSize: '64px',
                            fontWeight: 'bold',
                            color: 'white',
                            margin: '0',
                            lineHeight: '1.1',
                            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                            The Humor<br />Project
                        </h1>
                        <p style={{
                            fontSize: '20px',
                            color: 'rgba(255,255,255,0.95)',
                            margin: '0',
                            maxWidth: '650px',
                            lineHeight: '1.6'
                        }}>
                            Upload your photos. Let AI write captions. Vote on what's actually funny. Build the ultimate collection together.
                        </p>
                    </div>

                    {/* Feature Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '20px',
                        width: '100%',
                        maxWidth: '650px',
                        marginTop: '30px'
                    }}>
                        {/* Card 1 */}
                        <div style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(15px)',
                            borderRadius: '20px',
                            padding: '30px 20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                 e.currentTarget.style.transform = 'translateY(-8px)';
                                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                             }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '12px',
                                animation: 'float 2.5s ease-in-out infinite'
                            }}>
                                📸
                            </div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '18px',
                                margin: '0 0 8px 0',
                                fontWeight: 'bold'
                            }}>
                                Upload
                            </h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                margin: '0'
                            }}>
                                Share your funniest photos
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(15px)',
                            borderRadius: '20px',
                            padding: '30px 20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                 e.currentTarget.style.transform = 'translateY(-8px)';
                                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                             }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '12px',
                                animation: 'float 2.5s ease-in-out infinite',
                                animationDelay: '0.5s'
                            }}>
                                🤖
                            </div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '18px',
                                margin: '0 0 8px 0',
                                fontWeight: 'bold'
                            }}>
                                Generate
                            </h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                margin: '0'
                            }}>
                                AI captions in seconds
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(15px)',
                            borderRadius: '20px',
                            padding: '30px 20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                 e.currentTarget.style.transform = 'translateY(-8px)';
                                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                             }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '12px',
                                animation: 'float 2.5s ease-in-out infinite',
                                animationDelay: '1s'
                            }}>
                                👍
                            </div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '18px',
                                margin: '0 0 8px 0',
                                fontWeight: 'bold'
                            }}>
                                Vote
                            </h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                margin: '0'
                            }}>
                                Rate the funniest ones
                            </p>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div style={{
                        marginTop: '60px',
                        animation: 'bounce 2s ease-in-out infinite',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '32px'
                    }}>
                        ↓
                    </div>
                </div>
            </section>

            {/* Sign In Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    maxWidth: '500px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '30px',
                    animation: 'slideUp 0.8s ease-out'
                }}>
                    {/* Sign In Card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '28px',
                        padding: '50px 40px',
                        width: '100%',
                        boxShadow: '0 25px 100px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Gradient background */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-50%',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)',
                            borderRadius: '50%',
                            pointerEvents: 'none'
                        }} />

                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '25px'
                        }}>
                            <div style={{
                                fontSize: '60px',
                                animation: 'float 3s ease-in-out infinite'
                            }}>
                                🚀
                            </div>

                            <div style={{
                                textAlign: 'center'
                            }}>
                                <h2 style={{
                                    color: '#1a1a1a',
                                    fontSize: '32px',
                                    margin: '0 0 10px 0',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    Ready to Laugh?
                                </h2>

                                <p style={{
                                    color: '#666',
                                    fontSize: '15px',
                                    margin: '0',
                                    lineHeight: '1.5'
                                }}>
                                    Sign in to start creating and rating hilarious captions
                                </p>
                            </div>

                            {error && (
                                <div style={{
                                    backgroundColor: '#ffebee',
                                    color: '#c62828',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    textAlign: 'center',
                                    width: '100%'
                                }}>
                                    Error: {error}
                                </div>
                            )}

                            <button
                                onClick={handleGoogleLogin}
                                aria-label="Sign in with Google"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 25px rgba(102,126,234,0.3)',
                                    minHeight: '50px',
                                    marginBottom: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 12px 35px rgba(102,126,234,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(102,126,234,0.3)';
                                }}
                            >
                                🔐 Sign in with Google
                            </button>

                            <p style={{
                                color: '#999',
                                fontSize: '12px',
                                margin: '0',
                                lineHeight: '1.5',
                                textAlign: 'center'
                            }}>
                                No password needed. Secure OAuth authentication with Google.
                            </p>
                        </div>
                    </div>

                    {/* Trust badges */}
                    <div style={{
                        display: 'flex',
                        gap: '30px',
                        justifyContent: 'center',
                        width: '100%',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{ fontSize: '32px' }}>🔒</div>
                            <span style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}>
                Secure
              </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{ fontSize: '32px' }}>⚡</div>
                            <span style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}>
                Instant
              </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{ fontSize: '32px' }}>😊</div>
                            <span style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}>
                Fun
              </span>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 42px !important;
          }

          h2 {
            font-size: 24px !important;
          }

          p {
            font-size: 14px !important;
          }

          section {
            padding: 40px 20px !important;
            min-height: auto !important;
          }

          div[style*="padding: '50px 40px'"] {
            padding: 30px 24px !important;
          }
        }
      `}</style>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
            }}>
                Loading...
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}