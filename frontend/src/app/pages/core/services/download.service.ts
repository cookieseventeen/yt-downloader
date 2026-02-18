import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DownloadRequest, FormatsResponse, DownloadHistory, FileInfo } from '../models/download.model';
import { VideoResult } from '../models/video.model';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private readonly apiUrl = 'http://localhost:3000/api/download';
  private readonly HISTORY_KEY = 'yt-download-history';

  constructor(private http: HttpClient) {}

  /**
   * 取得影片可用格式
   */
  getFormats(videoId: string): Observable<FormatsResponse> {
    return this.http.get<FormatsResponse>(`${this.apiUrl}/formats/${videoId}`);
  }

  /**
   * 下載影片或音樂（直接觸發瀏覽器下載）
   */
  download(request: DownloadRequest): void {
    this.http
      .post(`${this.apiUrl}`, request, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;

          // 從 Content-Disposition 取得檔名
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `download.${request.type === 'audio' ? 'mp3' : 'mp4'}`;
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
            if (filenameMatch) {
              filename = decodeURIComponent(filenameMatch[1]);
            }
          }

          // 觸發瀏覽器下載
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);

          // 儲存歷史紀錄
          this.addHistory({
            id: `${request.videoId}-${Date.now()}`,
            videoId: request.videoId,
            title: filename,
            thumbnail: '',
            type: request.type,
            quality: request.quality,
            downloadedAt: new Date().toISOString(),
            status: 'success',
          });
        },
        error: (err) => {
          console.error('下載失敗:', err);
        },
      });
  }

  /**
   * 取得下載歷史
   */
  getHistory(): DownloadHistory[] {
    const data = localStorage.getItem(this.HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 新增下載歷史
   */
  addHistory(record: DownloadHistory): void {
    const history = this.getHistory();
    history.unshift(record);
    // 最多保留 100 筆
    if (history.length > 100) {
      history.splice(100);
    }
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  /**
   * 清除下載歷史
   */
  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }
  /**
   * 取得已下載檔案列表
   */
  getFiles(): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(`${this.apiUrl}/files`);
  }

  /**
   * 取得檔案串流 URL
   */
  getStreamUrl(filename: string): string {
    return `${this.apiUrl}/files/${filename}`;
  }

  /**
   * 刪除檔案
   */
  deleteFile(filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/files/${filename}`);
  }
  /**
   * 非同步下載（回傳 Task ID）
   */
  downloadAsync(request: DownloadRequest): Observable<{ taskId: string }> {
    return this.http.post<{ taskId: string }>(`${this.apiUrl}/async`, request);
  }

  /**
   * 取得下載進度 EventSource
   */
  getProgressSource(taskId: string): EventSource {
    return new EventSource(`${this.apiUrl}/progress/${taskId}`);
  }

  /**
   * 解析 YouTube 網址
   */
  parseUrl(url: string): Observable<VideoResult[]> {
    return this.http.post<VideoResult[]>(`${this.apiUrl}/parse`, { url });
  }
}
