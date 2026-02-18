import { Injectable, signal, computed } from '@angular/core';
import { DownloadService } from './download.service';
import { DownloadRequest, DownloadProgress } from '../models/download.model';
import { VideoResult } from '../models/video.model';
import { MessageService } from 'primeng/api';

export interface DownloadTask {
  id: string; // taskId
  videoId: string;
  title: string;
  thumbnail: string;
  type: 'video' | 'audio';
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  speed?: string;
  eta?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadQueueService {
  private tasksMap = new Map<string, DownloadTask>();
  // 使用 Signal 管理任務列表
  tasks = signal<DownloadTask[]>([]);
  
  // 計算正在下載的任務數量
  activeCount = computed(() => 
    this.tasks().filter(t => t.status === 'downloading' || t.status === 'pending').length
  );

  // 計算總進度 (平均值)
  totalProgress = computed(() => {
      const tasks = this.tasks();
      if (tasks.length === 0) return 0;
      const total = tasks.reduce((acc, t) => acc + (t.progress || 0), 0);
      return Math.round(total / tasks.length);
  });

  // 最大同時下載數
  readonly MAX_CONCURRENT_DOWNLOADS = 3;

  constructor(
    private downloadService: DownloadService,
    private messageService: MessageService
  ) {}

  /**
   * 加入下載佇列
   */
  addToQueue(video: VideoResult, request: DownloadRequest): void {
    // 產生臨時 ID (實際 ID 會在開始下載後由後端回傳，但這裡先用暫時 ID 佔位或直接開始)
    // 為了簡化，我們在 processQueue 時才真正呼叫 API 取得 taskId
    // 這裡先建立一個 pending task
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: DownloadTask = {
      id: tempId,
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      type: request.type,
      progress: 0,
      status: 'pending',
    };

    // 儲存 request 資訊以便稍後執行 (這需要擴充 DownloadTask 或另外儲存)
    // 為了不破壞現有結構，我們將 request 附加到 task 物件上 (需用 type assertion 或擴充 interface)
    (newTask as any).request = request;

    this.updateTask(tempId, newTask);
    this.messageService.add({
      severity: 'info',
      summary: '已加入佇列',
      detail: `${video.title} (等待下載)`,
    });

    this.processQueue();
  }

  /**
   * 處理下載佇列
   */
  private processQueue(): void {
    const currentTasks = Array.from(this.tasksMap.values());
    const downloadingCount = currentTasks.filter(t => t.status === 'downloading').length;

    if (downloadingCount >= this.MAX_CONCURRENT_DOWNLOADS) {
      return;
    }

    // 找出等待中的任務 (依加入時間排序，這裡假設 Map 順序即為加入順序)
    const pendingTask = currentTasks.find(t => t.status === 'pending');
    
    if (pendingTask) {
      this.startDownload(pendingTask);
    }
  }

  private startDownload(task: DownloadTask): void {
    const request = (task as any).request as DownloadRequest;
    
    // 更新狀態為準備中
    // task.status = 'downloading'; // 先不改，等 API 回傳真正的 ID
    
    this.downloadService.downloadAsync(request).subscribe({
      next: (res) => {
        const realTaskId = res.taskId;
        
        // 移除舊的 pending task，加入新的 downloading task
        this.tasksMap.delete(task.id);
        
        const tasks = Array.from(this.tasksMap.values()); // 重新取得陣列
        
        const newTask: DownloadTask = {
          ...task,
          id: realTaskId,
          status: 'downloading',
        };
        
        this.tasksMap.set(realTaskId, newTask);
        
        // 保持原本的順序需要一點技巧，但這裡簡單處理：pending 的會被移除，新的會加到最後
        // 若要嚴格排序，可以加 createdAt timestamp
        
        this.tasks.set(Array.from(this.tasksMap.values()));

        // 開始監聽進度
        this.startTracking(realTaskId);
        
        // 嘗試啟動下一個（如果有空位的話，雖然剛啟動一個通常沒空位，但檢查一下無妨）
        this.processQueue();
      },
      error: (err) => {
        console.error('啟動下載失敗:', err);
        this.updateTaskStatus(task.id, 'failed', '無法啟動下載');
        this.processQueue(); // 失敗了一個，嘗試下一個
      },
    });
  }


  private startTracking(taskId: string): void {
    const eventSource = this.downloadService.getProgressSource(taskId);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as DownloadProgress;
      this.updateTaskProgress(taskId, data);

      if (data.status === 'done') {
        eventSource.close();
        this.updateTaskStatus(taskId, 'completed');
        this.messageService.add({
            severity: 'success',
            summary: '下載完成',
            detail: this.tasksMap.get(taskId)?.title,
        });
        this.processQueue(); // 下載完成，觸發下一個
      } else if (data.status === 'error') {
        eventSource.close();
        this.updateTaskStatus(taskId, 'failed', '下載錯誤'); // 給個預設錯誤訊息
        this.messageService.add({
            severity: 'error',
            summary: '下載失敗',
            detail: this.tasksMap.get(taskId)?.title,
        });
        this.processQueue(); // 失敗也觸發下一個
      }
    };

    eventSource.onerror = (err) => {
      console.error(`SSE Error (Task ${taskId}):`, err);
      // 如果不是 done/error 狀態但斷線，視為失敗
      const task = this.tasksMap.get(taskId);
      if (task && task.status !== 'completed' && task.status !== 'failed') {
          this.updateTaskStatus(taskId, 'failed', '連線中斷');
          eventSource.close();
          this.processQueue(); // 斷線也觸發下一個
      }
    };
  }

  private updateTask(taskId: string, task: DownloadTask): void {
    this.tasksMap.set(taskId, task);
    this.tasks.set(Array.from(this.tasksMap.values()));
  }

  private updateTaskProgress(taskId: string, progress: DownloadProgress): void {
    const task = this.tasksMap.get(taskId);
    if (task) {
      task.progress = progress.progress;
      task.speed = progress.speed;
      task.eta = progress.eta;
      task.status = progress.status === 'downloading' ? 'downloading' : task.status;
      this.updateTask(taskId, task);
    }
  }

  private updateTaskStatus(taskId: string, status: DownloadTask['status'], error?: string): void {
    const task = this.tasksMap.get(taskId);
    if (task) {
      task.status = status;
      if (error) task.error = error;
      if (status === 'completed') task.progress = 100;
      this.updateTask(taskId, task);
    }
  }
  
  removeTask(taskId: string): void {
      this.tasksMap.delete(taskId);
      this.tasks.set(Array.from(this.tasksMap.values()));
  }
}
