import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DownloadService } from '../../core/services/download.service';
import { FileInfo } from '../../core/models/download.model';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './library.component.html',
})
export class LibraryComponent implements OnInit {
  files = signal<FileInfo[]>([]);
  
  // 播放器相關
  displayPlayer = false;
  currentFile: FileInfo | null = null;
  streamUrl = '';

  constructor(
    private downloadService: DownloadService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.downloadService.getFiles().subscribe({
      next: (files) => {
        this.files.set(files);
      },
      error: (err) => {
        console.error('無法取得檔案列表:', err);
        this.messageService.add({
          severity: 'error',
          summary: '錯誤',
          detail: '無法取得檔案列表',
        });
      },
    });
  }

  playFile(file: FileInfo): void {
    this.currentFile = file;
    this.streamUrl = this.downloadService.getStreamUrl(file.filename);
    this.displayPlayer = true;
  }

  downloadFileAction(file: FileInfo): void {
    this.downloadService.downloadFileDirectly(file.filename);
  }

  confirmDelete(file: FileInfo): void {
    this.confirmationService.confirm({
      message: `確定要刪除「${file.filename}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteFile(file);
      },
    });
  }

  deleteFile(file: FileInfo): void {
    this.downloadService.deleteFile(file.filename).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: '成功',
          detail: '檔案已刪除',
        });
        this.loadFiles(); // 重新載入列表
      },
      error: (err) => {
        console.error('刪除失敗:', err);
        this.messageService.add({
          severity: 'error',
          summary: '錯誤',
          detail: '刪除檔案失敗',
        });
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('zh-TW');
  }

  getTypeSeverity(type: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return type === 'audio' ? 'info' : 'success';
  }

  onPlayerHide(): void {
    this.currentFile = null;
    this.streamUrl = '';
  }
}
