import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DownloadService } from '../../core/services/download.service';
import { DownloadQueueService } from '../../core/services/download-queue.service';
import { VideoResult } from '../../core/models/video.model';

@Component({
  selector: 'app-link-parser',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    TagModule,
    DialogModule,
    RadioButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './link-parser.component.html',
})
export class LinkParserComponent {
  parserUrl = '';
  videos = signal<VideoResult[]>([]);
  loading = signal(false);

  // Download Dialog
  showDownloadDialog = false;
  selectedVideo: VideoResult | null = null;
  downloadType: 'video' | 'audio' = 'audio';

  constructor(
    private downloadService: DownloadService,
    private messageService: MessageService,
    private downloadQueueService: DownloadQueueService
  ) {}

  onParse(): void {
    if (!this.parserUrl.trim()) return;

    this.loading.set(true);
    this.videos.set([]); // Clear previous results

    this.downloadService.parseUrl(this.parserUrl).subscribe({
      next: (res) => {
        this.videos.set(res);
        this.loading.set(false);
        if (res.length === 0) {
            this.messageService.add({
                severity: 'info',
                summary: '無結果',
                detail: '找不到影片或播放清單內容'
            });
        }
      },
      error: (err) => {
        console.error('解析失敗:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: '解析失敗',
          detail: err.error?.message || '請確認網址是否正確',
        });
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onParse();
    }
  }

  formatData(count: string): string {
      // Simple formatter, can use same logic as SearchComponent if needed
      return count; 
  }

  // --- Download Logic ---

  openDownloadDialog(video: VideoResult): void {
    this.selectedVideo = video;
    this.showDownloadDialog = true;
    this.downloadType = 'audio'; // Default
  }

  onDownload(): void {
    if (!this.selectedVideo) return;

    this.downloadQueueService.addToQueue(this.selectedVideo, {
        videoId: this.selectedVideo.videoId,
        type: this.downloadType,
        quality: 'best'
    });

    this.showDownloadDialog = false;
    this.messageService.add({
        severity: 'success',
        summary: '已加入排程',
        detail: `${this.selectedVideo.title} 已加入下載排程`
    });
  }

  downloadAll(type: 'video' | 'audio'): void {
      const allVideos = this.videos();
      if (allVideos.length === 0) return;

      allVideos.forEach(video => {
          this.downloadQueueService.addToQueue(video, {
              videoId: video.videoId,
              type: type,
              quality: 'best'
          });
      });

      this.messageService.add({
          severity: 'success',
          summary: '批次下載',
          detail: `已將 ${allVideos.length} 個影片加入下載排程`
      });
  }
}
