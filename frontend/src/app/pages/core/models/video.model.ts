/** YouTube 影片搜尋結果模型 */
export interface VideoResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
}

/** 搜尋回應 */
export interface SearchResponse {
  results: VideoResult[];
}
