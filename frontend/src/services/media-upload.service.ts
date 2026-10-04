import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for streaming chunked upload

export interface ChunkUploadProgress {
  uploadedChunks: number;
  totalChunks: number;
  percentage: number;
}

export async function uploadChunkedVideo(
  videoBlob: Blob,
  username: string,
  onProgress?: (progress: ChunkUploadProgress) => void
): Promise<{ video_url: string; poster_url?: string; filename?: string; message: string }> {
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const totalChunks = Math.max(1, Math.ceil(videoBlob.size / CHUNK_SIZE));

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(videoBlob.size, start + CHUNK_SIZE);
    const chunkBlob = videoBlob.slice(start, end);

    const formData = new FormData();
    formData.append("upload_id", uploadId);
    formData.append("chunk_index", String(chunkIndex));
    formData.append("total_chunks", String(totalChunks));
    formData.append("username", username);
    formData.append("file", chunkBlob, `chunk_${chunkIndex}.webm`);

    await axios.post(`${API_BASE_URL}/v1/media/upload/chunk`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (onProgress) {
      const percentage = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      onProgress({
        uploadedChunks: chunkIndex + 1,
        totalChunks,
        percentage,
      });
    }
  }

  // Finalize and reassemble
  const completeRes = await axios.post(`${API_BASE_URL}/v1/media/upload/complete`, {
    upload_id: uploadId,
    total_chunks: totalChunks,
    username: username,
    filename: `${username}_pitch.webm`,
  });

  return completeRes.data;
}

export async function uploadAvatar(
  file: File,
  username: string
): Promise<{ avatar_url: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.patch(
    `${API_BASE_URL}/v1/profile/${username}/avatar/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data;
}

export async function uploadResume(
  file: File,
  username: string
): Promise<{ resume_url: string; filename: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.patch(
    `${API_BASE_URL}/v1/profile/${username}/resume/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data;
}

export function downloadCandidatePdf(username: string) {
  const url = `${API_BASE_URL}/v1/profile/${username}/pdf/`;
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${username}_CV_2026.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
