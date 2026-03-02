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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showUpload, setShowUpload] = useState(true);
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
                .limit(50);

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
                setCurrentIndex(0);
                setShowUpload(false);
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

            // Auto-scroll to next after voting
            setTimeout(() => {
                if (currentIndex < captions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                }
            }, 300);
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

    // Handle keyboard scrolling
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowDown') {
                if (currentIndex < captions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                }
            } else if (e.key === 'ArrowUp') {
                if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, captions.length]);

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

    const currentCaption = captions[currentIndex];

    return (
        <main style={{ background: '#000000', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '15px 20px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 10
            }}>
                <div>
                    <h1 style={{ margin: '0', fontSize: '24px' }}>🎬 Humor Project</h1>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
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

            {/* Upload Section - Show only if no captions */}
            {showUpload && captions.length === 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'calc(100vh - 70px)',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '60px 40px',
                        maxWidth: '500px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ color: '#000', fontSize: '28px', marginBottom: '15px' }}>
                            📸 Upload Your First Image
                        </h2>
                        <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px', lineHeight: '1.6' }}>
                            Upload an image and our AI will generate hilarious captions. Then rate them like you're scrolling through TikTok!
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
                                <p style={{ color: '#666', marginBottom: '10px' }}>Preview:</p>
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        maxHeight: '250px',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Captions Reel Section */}
            {!showUpload && captions.length > 0 && currentCaption && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'calc(100vh - 70px)',
                    padding: '20px',
                    position: 'relative'
                }}>
                    {/* Caption Card */}
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.3s ease-in'
                    }}>
                        {/* Image Section */}
                        {currentCaption.images && currentCaption.images.url && (
                            <div style={{
                                width: '100%',
                                flex: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#000000',
                                minHeight: '300px'
                            }}>
                                <img
                                    src={currentCaption.images.url}
                                    alt={currentCaption.content}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        )}

                        {/* Text Section */}
                        <div style={{
                            padding: '20px',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            borderTop: '1px solid #333',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            <p style={{
                                color: '#ffffff',
                                fontSize: '18px',
                                margin: '0',
                                lineHeight: '1.5',
                                fontWeight: '500'
                            }}>
                                💬 {currentCaption.content}
                            </p>

                            <p style={{
                                fontSize: '12px',
                                color: '#999',
                                margin: '0'
                            }}>
                                📅 {new Date(currentCaption.created_datetime_utc).toLocaleDateString()}
                            </p>

                            {/* Vote Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                marginTop: '10px'
                            }}>
                                <button
                                    onClick={() => handleVote(currentCaption.id, 1)}
                                    disabled={votingId === currentCaption.id}
                                    style={{
                                        flex: '1',
                                        padding: '12px 16px',
                                        backgroundColor: userVotes[currentCaption.id] === 1 ? '#4CAF50' : '#333333',
                                        color: userVotes[currentCaption.id] === 1 ? 'white' : '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: votingId === currentCaption.id ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (votingId !== currentCaption.id) {
                                            e.target.style.backgroundColor = '#4CAF50';
                                            e.target.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (userVotes[currentCaption.id] !== 1) {
                                            e.target.style.backgroundColor = '#333333';
                                        }
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    👍 Upvote
                                </button>
                                <button
                                    onClick={() => handleVote(currentCaption.id, -1)}
                                    disabled={votingId === currentCaption.id}
                                    style={{
                                        flex: '1',
                                        padding: '12px 16px',
                                        backgroundColor: userVotes[currentCaption.id] === -1 ? '#f44336' : '#333333',
                                        color: userVotes[currentCaption.id] === -1 ? 'white' : '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: votingId === currentCaption.id ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (votingId !== currentCaption.id) {
                                            e.target.style.backgroundColor = '#f44336';
                                            e.target.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (userVotes[currentCaption.id] !== -1) {
                                            e.target.style.backgroundColor = '#333333';
                                        }
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    👎 Downvote
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Info */}
                    <div style={{
                        marginTop: '20px',
                        color: '#999',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: '0' }}>
                            {currentIndex + 1} of {captions.length}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                            Use arrow keys or scroll to navigate
                        </p>
                    </div>

                    {/* Upload New Button */}
                    <button
                        onClick={() => setShowUpload(true)}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            backgroundColor: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#764ba2';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#667eea';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        📸 Upload New Image
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </main>
    );
}