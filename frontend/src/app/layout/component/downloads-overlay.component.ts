import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DownloadQueueService, DownloadTask } from '../../pages/core/services/download-queue.service';

@Component({
  selector: 'app-downloads-overlay',
  standalone: true,
  imports: [
    CommonModule,
    PopoverModule,
    ButtonModule,
    ProgressBarModule,
    TagModule
  ],
  templateUrl: './downloads-overlay.component.html',
})
export class DownloadsOverlayComponent {
  queueService = inject(DownloadQueueService);
  
  // 任務列表 (倒序，最新的在上面)
  tasks = this.queueService.tasks;

  getStatusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'downloading': return 'info';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return '完成';
      case 'failed': return '失敗';
      case 'downloading': return '下載中';
      case 'pending': return '等待中';
      default: return status;
    }
  }
  
  removeTask(taskId: string, event: Event): void {
      event.stopPropagation();
      this.queueService.removeTask(taskId);
  }
}
