/** 下載請求 */
export interface DownloadRequest {
  videoId: string;
  type: 'video' | 'audio';
  quality: string;
}

/** 影片可用格式 */
export interface VideoFormat {
  formatId: string;
  quality: string;
  ext: string;
  size: string;
}

/** 格式回應 */
export interface FormatsResponse {
  title: string;
  duration: string;
  thumbnail: string;
  formats: {
    video: VideoFormat[];
    audio: VideoFormat[];
  };
}

/** 下載進度 */
export interface DownloadProgress {
  progress: number;
  speed: string;
  eta: string;
  status: 'downloading' | 'processing' | 'done' | 'error';
  filename?: string;
}

/** 下載歷史紀錄 */
export interface DownloadHistory {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  type: 'video' | 'audio';
  quality: string;
  downloadedAt: string;
  status: 'success' | 'failed';
}

/** 檔案資訊 */
export interface FileInfo {
  filename: string;
  size: number;
  updatedAt: string;
  type: 'video' | 'audio';
}
