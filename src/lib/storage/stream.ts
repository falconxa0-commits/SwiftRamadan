// Cloudflare Stream — Video hosting & streaming
// Docs: https://developers.cloudflare.com/stream/

const CF_ACCOUNT_ID = process.env.CF_STREAM_ACCOUNT_ID || '';
const CF_API_TOKEN = process.env.CF_STREAM_API_TOKEN || '';
const CF_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`;

export interface VideoUploadResult {
  success: boolean;
  uid: string;
  playbackUrl: string;
  thumbnailUrl: string;
  status: string;
}

export async function uploadVideo({
  file,
  name,
  meta,
}: {
  file: Buffer;
  name: string;
  meta?: Record<string, string>;
}): Promise<VideoUploadResult> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.log('[CF Stream] Not configured — returning mock video');
    return {
      success: true,
      uid: `mock-${Date.now()}`,
      playbackUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://placehold.co/640x360/0B0D14/10E07A?text=Video',
      status: 'ready',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([file]), name);
    if (meta) {
      formData.append('meta', JSON.stringify(meta));
    }

    const response = await fetch(CF_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success && data.result) {
      return {
        success: true,
        uid: data.result.uid,
        playbackUrl: `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${data.result.uid}/manifest/video.m3u8`,
        thumbnailUrl: `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${data.result.uid}/thumbnails/thumbnail.jpg`,
        status: data.result.status?.state || 'processing',
      };
    }
    return { success: false, uid: '', playbackUrl: '', thumbnailUrl: '', status: 'error' };
  } catch (error) {
    console.error('[CF Stream] Upload error:', error);
    return { success: false, uid: '', playbackUrl: '', thumbnailUrl: '', status: 'error' };
  }
}

export async function getVideoStatus(uid: string): Promise<{ status: string; playbackUrl?: string }> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    return { status: 'ready', playbackUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' };
  }

  try {
    const response = await fetch(`${CF_BASE_URL}/${uid}`, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });
    const data = await response.json();
    return {
      status: data.result?.status?.state || 'unknown',
      playbackUrl: data.result?.playback?.hls || '',
    };
  } catch {
    return { status: 'unknown' };
  }
}

export async function deleteVideo(uid: string): Promise<boolean> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return true;
  try {
    await fetch(`${CF_BASE_URL}/${uid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });
    return true;
  } catch {
    return false;
  }
}

export function isStreamConfigured(): boolean {
  return !!(CF_ACCOUNT_ID && CF_API_TOKEN);
}
