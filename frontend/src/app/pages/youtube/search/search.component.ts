import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { YoutubeService } from '../../core/services/youtube.service';
import { DownloadQueueService } from '../../core/services/download-queue.service';
import { DownloadService } from '../../core/services/download.service';
import { VideoResult } from '../../core/models/video.model';
import { FormatsResponse } from '../../core/models/download.model';

@Component({
  selector: 'app-search',
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
    SelectModule,
    ProgressBarModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './search.component.html',
})
export class SearchComponent {
  searchQuery = '';
  videos = signal<VideoResult[]>([]);
  loading = signal(false);
  // downloading = signal(false); // 改由 QueueService 管理

  // 下載彈窗
  showDownloadDialog = false;
  selectedVideo: VideoResult | null = null;
  downloadType: 'video' | 'audio' = 'audio';
  selectedQuality = 'best';
  formats: FormatsResponse | null = null;
  loadingFormats = signal(false);

  constructor(
    private youtubeService: YoutubeService,
    private downloadService: DownloadService,
    private messageService: MessageService,
    private downloadQueueService: DownloadQueueService
  ) {}

  onSearch(): void {
    if (!this.searchQuery.trim()) return;

    this.loading.set(true);
    this.youtubeService.search(this.searchQuery, 12).subscribe({
      next: (res) => {
        this.videos.set(res.results);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('搜尋失敗:', err);
        this.messageService.add({
          severity: 'error',
          summary: '搜尋失敗',
          detail: err.error?.message || '無法連線至後端伺服器',
        });
        this.loading.set(false);
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  openDownloadDialog(video: VideoResult): void {
    this.selectedVideo = video;
    this.showDownloadDialog = true;
    this.downloadType = 'audio';
    this.selectedQuality = 'best';
    this.formats = null;
  }

  onDownload(): void {
    if (!this.selectedVideo) return;

    this.showDownloadDialog = false;

    this.messageService.add({
      severity: 'info',
      summary: '開始下載',
      detail: `正在下載：${this.selectedVideo.title}`,
      life: 5000,
    });

    this.downloadQueueService.addToQueue(this.selectedVideo, {
      videoId: this.selectedVideo.videoId,
      type: this.downloadType,
      quality: this.selectedQuality,
    });

    // 下載已交給 QueueService 處理，無需 setTimeout
    // setTimeout(() => {
    //   this.downloading.set(false);
    // }, 3000);
  }

  formatViewCount(count: string): string {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}億`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}萬`;
    return num.toLocaleString();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
  }
}
