'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { generatePresignedUrl, uploadImageToPresignedUrl, registerImageUrl, generateCaptions } from '@/lib/caption-pipeline';

export default function Home() {
    const [captions, setCaptions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userVotes, setUserVotes] = useState({});
    const [votingId, setVotingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
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

            const { data } = await supabaseClient.auth.getSession();
            if (data.session) {
                setUserToken(data.session.access_token);
            }

            fetchCaptions();
            fetchUserVotes(user.id);
        };

        checkAuthAndFetch();
    }, [router, supabaseClient]);

    const fetchCaptions = async () => {
        try {
            const { data, error } = await supabase
                .from('captions')
                .select('*, images(url)')
                .limit(20);

            if (error) throw error;
            setCaptions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserVotes = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('caption_votes')
                .select('caption_id, vote_value')
                .eq('profile_id', userId);

            if (error) throw error;

            const votesMap = {};
            data.forEach(vote => {
                votesMap[vote.caption_id] = vote.vote_value;
            });
            setUserVotes(votesMap);
        } catch (err) {
            console.error('Error fetching votes:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userToken) return;

        setUploading(true);

        const imageUrl = URL.createObjectURL(file);
        setUploadedImage(imageUrl);

        try {
            const { presignedUrl, cdnUrl } = await generatePresignedUrl(userToken, file.type);
            await uploadImageToPresignedUrl(presignedUrl, file);
            const { imageId } = await registerImageUrl(userToken, cdnUrl);
            const generatedCaptions = await generateCaptions(userToken, imageId);

            if (generatedCaptions && Array.isArray(generatedCaptions)) {
                setCaptions(prev => [...generatedCaptions, ...prev]);
            }

            alert('Image processed and captions generated!');
        } catch (err) {
            console.error('Error uploading image:', err);
            alert('Failed to process image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleVote = async (captionId, voteValue) => {
        if (!user) return;

        setVotingId(captionId);

        try {
            const { data: existingVote } = await supabase
                .from('caption_votes')
                .select('id')
                .eq('caption_id', captionId)
                .eq('profile_id', user.id);

            if (existingVote && existingVote.length > 0) {
                const { error } = await supabase
                    .from('caption_votes')
                    .update({
                        vote_value: voteValue,
                        modified_datetime_utc: new Date().toISOString()
                    })
                    .eq('id', existingVote[0].id);

                if (error) throw error;
            } else {
                const now = new Date().toISOString();
                const { error } = await supabase
                    .from('caption_votes')
                    .insert({
                        caption_id: captionId,
                        profile_id: user.id,
                        vote_value: voteValue,
                        created_datetime_utc: now,
                        modified_datetime_utc: now
                    });

                if (error) throw error;
            }

            setUserVotes(prev => ({
                ...prev,
                [captionId]: voteValue
            }));
        } catch (err) {
            console.error('Error voting:', err);
            alert('Failed to submit vote: ' + err.message);
        } finally {
            setVotingId(null);
        }
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        router.push('/login');
    };

    if (loading) return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontSize: '18px',
            color: '#666'
        }}>
            Loading...
        </div>
    );
    if (!user) return null;
    if (error) return <div style={{ padding: '20px', color: '#f44336', fontSize: '16px' }}>Error: {error}</div>;

    return (
        <main style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px 20px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>🎬 Humor Project</h1>
                    <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>Logged in as: {user.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    }}
                >
                    Logout
                </button>
            </header>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
                {/* Upload Section */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '40px',
                    marginBottom: '40px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ color: '#000', fontSize: '26px', marginBottom: '10px', margin: '0 0 10px 0' }}>
                        📸 Upload Image for Caption Generation
                    </h2>
                    <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
                        Upload an image and our AI will generate hilarious captions
                    </p>

                    <label style={{
                        display: 'inline-block',
                        padding: '14px 32px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(76,175,80,0.3)'
                    }}
                           onMouseEnter={(e) => {
                               if (!uploading) {
                                   e.target.style.backgroundColor = '#45a049';
                                   e.target.style.transform = 'translateY(-2px)';
                                   e.target.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
                               }
                           }}
                           onMouseLeave={(e) => {
                               e.target.style.backgroundColor = '#4CAF50';
                               e.target.style.transform = 'translateY(0)';
                               e.target.style.boxShadow = '0 4px 15px rgba(76,175,80,0.3)';
                           }}>
                        {uploading ? '⏳ Processing...' : '📁 Choose Image'}
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                    </label>

                    {uploadedImage && (
                        <div style={{ marginTop: '30px' }}>
                            <h3 style={{ color: '#000', fontSize: '18px', marginBottom: '15px' }}>Uploaded Image Preview</h3>
                            <img
                                src={uploadedImage}
                                alt="Uploaded"
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Captions Section */}
                <div>
                    <h2 style={{ color: '#000', fontSize: '26px', marginBottom: '20px' }}>✨ Generated Captions</h2>
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {captions.length === 0 ? (
                            <div style={{
                                backgroundColor: '#ffffff',
                                padding: '40px',
                                borderRadius: '12px',
                                textAlign: 'center',
                                color: '#999'
                            }}>
                                <p style={{ fontSize: '16px' }}>Upload an image to generate captions</p>
                            </div>
                        ) : (
                            captions.map((caption) => (
                                <div key={caption.id} style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                     onMouseEnter={(e) => {
                                         e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.15)';
                                         e.currentTarget.style.transform = 'translateY(-2px)';
                                     }}
                                     onMouseLeave={(e) => {
                                         e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                         e.currentTarget.style.transform = 'translateY(0)';
                                     }}>
                                    {caption.images && caption.images.url && (
                                        <div style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            backgroundColor: '#f0f0f0'
                                        }}>
                                            <img
                                                src={caption.images.url}
                                                alt={caption.content}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    maxHeight: '500px',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ padding: '20px' }}>
                                        <p style={{ color: '#000', fontSize: '16px', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                                            <strong>💬 {caption.content}</strong>
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#999', margin: '0 0 15px 0' }}>
                                            📅 {new Date(caption.created_datetime_utc).toLocaleDateString()}
                                        </p>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleVote(caption.id, 1)}
                                                disabled={votingId === caption.id}
                                                style={{
                                                    padding: '10px 16px',
                                                    backgroundColor: userVotes[caption.id] === 1 ? '#4CAF50' : '#e0e0e0',
                                                    color: userVotes[caption.id] === 1 ? 'white' : '#333',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: votingId === caption.id ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (votingId !== caption.id) {
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                            >
                                                👍 Upvote
                                            </button>
                                            <button
                                                onClick={() => handleVote(caption.id, -1)}
                                                disabled={votingId === caption.id}
                                                style={{
                                                    padding: '10px 16px',
                                                    backgroundColor: userVotes[caption.id] === -1 ? '#f44336' : '#e0e0e0',
                                                    color: userVotes[caption.id] === -1 ? 'white' : '#333',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: votingId === caption.id ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (votingId !== caption.id) {
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                            >
                                                👎 Downvote
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}