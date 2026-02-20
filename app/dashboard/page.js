'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);
            setLoading(false);
        };

        getUser();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (!user) return null;

    return (
        <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>Welcome, {user.email}!</h1>
            <p>You are logged in.</p>
            <button
                onClick={handleLogout}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Logout
            </button>
        </main>
    );
}