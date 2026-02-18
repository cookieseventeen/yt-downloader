import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DownloadService } from '../../core/services/download.service';
import { DownloadHistory } from '../../core/models/download.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule],
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  history = signal<DownloadHistory[]>([]);

  constructor(private downloadService: DownloadService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.history.set(this.downloadService.getHistory());
  }

  clearHistory(): void {
    this.downloadService.clearHistory();
    this.history.set([]);
  }

  getTypeSeverity(type: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return type === 'audio' ? 'info' : 'success';
  }

  getStatusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return status === 'success' ? 'success' : 'danger';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('zh-TW');
  }
}
