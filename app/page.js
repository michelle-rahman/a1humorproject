'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCaptions();
    }, []);

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

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>Captions List</h1>
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