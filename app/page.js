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

            // Get the user's session token for API calls
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

        // Show the uploaded image preview
        const imageUrl = URL.createObjectURL(file);
        setUploadedImage(imageUrl);

        try {
            // Step 1: Generate presigned URL
            const { presignedUrl, cdnUrl } = await generatePresignedUrl(userToken, file.type);

            // Step 2: Upload image to presigned URL
            await uploadImageToPresignedUrl(presignedUrl, file);

            // Step 3: Register image URL
            const { imageId } = await registerImageUrl(userToken, cdnUrl);

            // Step 4: Generate captions
            const generatedCaptions = await generateCaptions(userToken, imageId);

            // Add generated captions to the list
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

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (!user) return null;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#fff' }}>Captions List</h1>
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

            <div style={{ marginBottom: '30px', padding: '30px', backgroundColor: '#ffffff', borderRadius: '8px', border: '2px solid #ddd' }}>
                <h2 style={{ color: '#000', fontSize: '28px', marginBottom: '20px' }}>Upload Image for Caption Generation</h2>

                <label style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s',
                }}>
                    Choose Image
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        style={{
                            display: 'none'
                        }}
                    />
                </label>

                {uploading && <p style={{ color: '#000', marginTop: '10px', fontSize: '16px' }}>⏳ Processing image...</p>}

                {uploadedImage && (
                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ color: '#000', fontSize: '18px', marginBottom: '10px' }}>Uploaded Image</h3>
                        <img
                            src={uploadedImage}
                            alt="Uploaded"
                            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                        />
                    </div>
                )}
            </div>

            <h2 style={{ color: '#fff' }}>Generated Captions</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
                {captions.map((caption) => (
                    <div key={caption.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                        <p style={{ color: '#000' }}><strong>Content:</strong> {caption.content}</p>
                        <p style={{ fontSize: '12px', color: '#666' }}><strong>Created:</strong> {new Date(caption.created_datetime_utc).toLocaleDateString()}</p>
                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleVote(caption.id, 1)}
                                disabled={votingId === caption.id}
                                style={{
                                    padding: '8px 15px',
                                    backgroundColor: userVotes[caption.id] === 1 ? '#4CAF50' : '#e0e0e0',
                                    color: userVotes[caption.id] === 1 ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: votingId === caption.id ? 'not-allowed' : 'pointer'
                                }}
                            >
                                👍 Upvote
                            </button>
                            <button
                                onClick={() => handleVote(caption.id, -1)}
                                disabled={votingId === caption.id}
                                style={{
                                    padding: '8px 15px',
                                    backgroundColor: userVotes[caption.id] === -1 ? '#f44336' : '#e0e0e0',
                                    color: userVotes[caption.id] === -1 ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: votingId === caption.id ? 'not-allowed' : 'pointer'
                                }}
                            >
                                👎 Downvote
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}