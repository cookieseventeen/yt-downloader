import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { OperationRecord } from '../../core/models/auth.model';

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    SelectModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './operations.component.html',
})
export class OperationsComponent implements OnInit {
  records = signal<OperationRecord[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  page = 1;
  rows = 15;
  selectedType: string | null = null;

  typeOptions = [
    { label: '全部', value: null },
    { label: '登入', value: 'login' },
    { label: '註冊', value: 'register' },
    { label: '搜尋', value: 'search' },
    { label: '下載', value: 'download' },
    { label: '解析網址', value: 'parse_url' },
    { label: '刪除檔案', value: 'delete_file' },
    { label: '瀏覽媒體庫', value: 'view_library' },
    { label: '查看格式', value: 'view_formats' },
  ];

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);
    this.authService
      .getOperations(this.page, this.rows, this.selectedType || undefined)
      .subscribe({
        next: (res) => {
          this.records.set(res.items);
          this.totalRecords.set(res.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: '載入失敗',
            detail: err.error?.message || '無法載入操作紀錄',
          });
        },
      });
  }

  onPageChange(event: any): void {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadRecords();
  }

  onTypeFilter(): void {
    this.page = 1;
    this.loadRecords();
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      login: 'info',
      register: 'success',
      search: 'info',
      download: 'success',
      parse_url: 'warn',
      delete_file: 'danger',
      view_library: 'secondary',
      view_formats: 'secondary',
    };
    return map[type] || 'info';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      login: '登入',
      register: '註冊',
      search: '搜尋',
      download: '下載',
      parse_url: '解析網址',
      delete_file: '刪除檔案',
      view_library: '瀏覽媒體庫',
      view_formats: '查看格式',
    };
    return map[type] || type;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW');
  }
}
