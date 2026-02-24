export async function generatePresignedUrl(token: string, contentType: string) {
    const response = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType }),
    });

    if (!response.ok) throw new Error('Failed to generate presigned URL');
    return response.json();
}

export async function uploadImageToPresignedUrl(presignedUrl: string, file: File) {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    if (!response.ok) throw new Error('Failed to upload image');
}

export async function registerImageUrl(token: string, cdnUrl: string) {
    const response = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUrl: cdnUrl,
            isCommonUse: false,
        }),
    });

    if (!response.ok) throw new Error('Failed to register image');
    return response.json();
}

export async function generateCaptions(token: string, imageId: string) {
    const response = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId }),
    });

    if (!response.ok) throw new Error('Failed to generate captions');
    return response.json();
}