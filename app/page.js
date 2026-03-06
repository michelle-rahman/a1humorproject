'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { generatePresignedUrl, uploadImageToPresignedUrl, registerImageUrl, generateCaptions } from '@/lib/caption-pipeline';

export default function Home() {
    const [captions, setCaptions] = useState([]);
    const [originalCaptions, setOriginalCaptions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userVotes, setUserVotes] = useState({});
    const [votingId, setVotingId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [customCaptionCount, setCustomCaptionCount] = useState(0);
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
            const allCaptions = data || [];
            setCaptions(allCaptions);
            setOriginalCaptions(allCaptions);
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
            if (data) {
                data.forEach(vote => {
                    votesMap[vote.caption_id] = vote.vote_value;
                });
            }
            setUserVotes(votesMap);
        } catch (err) {
            console.error('Error fetching votes:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userToken) {
            alert('Please select an image');
            return;
        }

        setUploading(true);

        try {
            const { presignedUrl, cdnUrl } = await generatePresignedUrl(userToken, file.type);
            await uploadImageToPresignedUrl(presignedUrl, file);
            const { imageId } = await registerImageUrl(userToken, cdnUrl);
            const generatedCaptions = await generateCaptions(userToken, imageId);

            if (generatedCaptions && Array.isArray(generatedCaptions) && generatedCaptions.length > 0) {
                // Prepend custom captions to the original database captions
                const allCaptions = [...generatedCaptions, ...originalCaptions];
                setCaptions(allCaptions);
                setUploadedImageUrl(cdnUrl);
                setCustomCaptionCount(generatedCaptions.length);
                setCurrentIndex(0);
                alert('Image processed and captions generated! Rate these, then you\'ll continue with more captions.');
            } else {
                alert('No captions generated. Please try again.');
            }
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

            // Auto-advance to next caption
            setTimeout(() => {
                if (currentIndex < captions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                }
            }, 500);
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

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowRight' && currentIndex < captions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, captions.length]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '18px',
                color: '#fff'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '20px',
                        animation: 'bounce 2s infinite'
                    }}>
                        🎬
                    </div>
                    <p>Loading your captions...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                color: '#f44336'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Error Loading Captions</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const currentCaption = captions[currentIndex];
    const progressPercentage = captions.length > 0 ? ((currentIndex + 1) / captions.length) * 100 : 0;

    if (captions.length === 0) {
        return (
            <main style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <header style={{
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '2px solid rgba(255,255,255,0.1)'
                }}>
                    <h1 style={{ margin: '0', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>🎬 The Humor Project</h1>
                    <button
                        onClick={handleLogout}
                        aria-label="Logout"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Logout
                    </button>
                </header>

                {/* Empty State with Upload */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        padding: '60px 40px',
                        maxWidth: '500px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            fontSize: '80px',
                            marginBottom: '30px',
                            animation: 'float 3s ease-in-out infinite'
                        }}>
                            📸
                        </div>
                        <h2 style={{
                            color: '#1a1a1a',
                            fontSize: '28px',
                            margin: '0 0 15px 0',
                            fontWeight: 'bold'
                        }}>
                            Upload Your First Image
                        </h2>
                        <p style={{
                            color: '#666',
                            fontSize: '16px',
                            margin: '0 0 40px 0',
                            lineHeight: '1.6'
                        }}>
                            Upload an image and our AI will generate hilarious captions. Then rate them!
                        </p>

                        <label
                            htmlFor="image-upload"
                            style={{
                                display: 'inline-block',
                                padding: '16px 32px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                borderRadius: '8px',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(76,175,80,0.3)',
                                opacity: uploading ? 0.7 : 1
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
                            }}
                        >
                            {uploading ? '⏳ Processing...' : '📁 Choose Image'}
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                aria-label="Upload image file"
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                    @keyframes bounce {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                `}</style>
            </main>
        );
    }

    return (
        <main style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <header style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                borderBottom: '2px solid rgba(255,255,255,0.1)'
            }}>
                <div>
                    <h1 style={{ margin: '0', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>🎬 The Humor Project</h1>
                    <p style={{ margin: '5px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                        Logged in as: {user.email}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <label
                        htmlFor="upload-image"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'rgba(76,175,80,0.8)',
                            color: 'white',
                            border: '2px solid #4CAF50',
                            borderRadius: '8px',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            opacity: uploading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!uploading) {
                                e.target.style.backgroundColor = '#4CAF50';
                                e.target.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(76,175,80,0.8)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        {uploading ? '⏳ Processing...' : '📸 Upload Image'}
                        <input
                            id="upload-image"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            aria-label="Upload new image"
                            style={{ display: 'none' }}
                        />
                    </label>
                    <button
                        onClick={handleLogout}
                        aria-label="Logout"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Progress Bar */}
            <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.2)',
                position: 'relative',
                role: 'progressbar',
                ariaValuenow: Math.round(progressPercentage),
                ariaValuemin: 0,
                ariaValuemax: 100
            }}>
                <div style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)',
                    transition: 'width 0.6s ease-in-out'
                }} />
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background blur effect */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Caption Card */}
                {currentCaption && (
                    <div
                        key={currentIndex}
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            maxWidth: '600px',
                            width: '100%',
                            animation: 'slideIn 0.5s ease-out'
                        }}
                    >


                        {/* Image Container - Show uploaded image for custom captions, original for database captions */}
                        {(currentIndex < customCaptionCount ? uploadedImageUrl : (currentCaption.images && currentCaption.images.url)) && (
                            <div style={{
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                marginBottom: '30px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                                background: '#000'
                            }}>
                                <img
                                    src={currentIndex < customCaptionCount ? uploadedImageUrl : currentCaption.images.url}
                                    alt="Caption image"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        )}

                        {/* Caption Text Container */}
                        <div style={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            padding: '30px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            marginBottom: '30px'
                        }}>
                            <p style={{
                                fontSize: '24px',
                                fontWeight: '600',
                                color: '#1a1a1a',
                                margin: '0 0 15px 0',
                                lineHeight: '1.5'
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
                        </div>

                        {/* Vote Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'center',
                            marginBottom: '20px'
                        }}>
                            <button
                                onClick={() => handleVote(currentCaption.id, 1)}
                                disabled={votingId === currentCaption.id}
                                aria-label="Upvote this caption"
                                aria-pressed={userVotes[currentCaption.id] === 1}
                                style={{
                                    flex: 1,
                                    padding: '16px 24px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    backgroundColor: userVotes[currentCaption.id] === 1 ? '#4CAF50' : 'rgba(255,255,255,0.2)',
                                    color: userVotes[currentCaption.id] === 1 ? '#fff' : '#fff',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '12px',
                                    cursor: votingId === currentCaption.id ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: votingId === currentCaption.id ? 0.7 : 1,
                                    backdropFilter: 'blur(10px)',
                                    minHeight: '50px'
                                }}
                                onMouseEnter={(e) => {
                                    if (votingId !== currentCaption.id) {
                                        e.target.style.backgroundColor = '#4CAF50';
                                        e.target.style.transform = 'translateY(-4px)';
                                        e.target.style.boxShadow = '0 8px 20px rgba(76,175,80,0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (userVotes[currentCaption.id] !== 1) {
                                        e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                    }
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                👍 Love It
                            </button>
                            <button
                                onClick={() => handleVote(currentCaption.id, -1)}
                                disabled={votingId === currentCaption.id}
                                aria-label="Downvote this caption"
                                aria-pressed={userVotes[currentCaption.id] === -1}
                                style={{
                                    flex: 1,
                                    padding: '16px 24px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    backgroundColor: userVotes[currentCaption.id] === -1 ? '#f44336' : 'rgba(255,255,255,0.2)',
                                    color: userVotes[currentCaption.id] === -1 ? '#fff' : '#fff',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '12px',
                                    cursor: votingId === currentCaption.id ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: votingId === currentCaption.id ? 0.7 : 1,
                                    backdropFilter: 'blur(10px)',
                                    minHeight: '50px'
                                }}
                                onMouseEnter={(e) => {
                                    if (votingId !== currentCaption.id) {
                                        e.target.style.backgroundColor = '#f44336';
                                        e.target.style.transform = 'translateY(-4px)';
                                        e.target.style.boxShadow = '0 8px 20px rgba(244,67,54,0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (userVotes[currentCaption.id] !== -1) {
                                        e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                    }
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                👎 Not for Me
                            </button>
                        </div>

                        {/* Counter and Navigation */}
                        <div style={{
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '14px'
                        }}>
                            <p style={{ margin: '0 0 10px 0' }} role="status" aria-live="polite">
                                <strong>{currentIndex + 1}</strong> of <strong>{captions.length}</strong> ({Math.round(progressPercentage)}%)
                            </p>
                            <p style={{ margin: '0', fontSize: '12px' }}>
                                💡 Use arrow keys or buttons to navigate
                            </p>
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'center',
                            marginTop: '20px'
                        }}>
                            <button
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                aria-label="Previous caption"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '8px',
                                    cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    opacity: currentIndex === 0 ? 0.5 : 1,
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentIndex > 0) {
                                        e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                }}
                            >
                                ← Previous
                            </button>
                            <button
                                onClick={() => setCurrentIndex(Math.min(captions.length - 1, currentIndex + 1))}
                                disabled={currentIndex === captions.length - 1}
                                aria-label="Next caption"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '8px',
                                    cursor: currentIndex === captions.length - 1 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    opacity: currentIndex === captions.length - 1 ? 0.5 : 1,
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentIndex < captions.length - 1) {
                                        e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

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
                        transform: scale(1.1);
                    }
                }
            `}</style>
        </main>
    );
}