'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [captions, setCaptions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const supabaseClient = createClient();

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);
            fetchCaptions();
        };

        checkAuthAndFetch();
    }, [router, supabaseClient]);

    const fetchCaptions = async () => {
        try {
            const { data, error } = await supabase
                .from('captions')
                .select('*')
                .limit(20);

            if (error) throw error;
            setCaptions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        router.push('/login');
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (!user) return null;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>Captions List</h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>Logged in as: {user.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>
            <div style={{ display: 'grid', gap: '20px' }}>
                {captions.map((caption) => (
                    <div key={caption.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <p><strong>Content:</strong> {caption.content}</p>
                        <p style={{ fontSize: '12px', color: '#666' }}><strong>Created:</strong> {new Date(caption.created_datetime_utc).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}