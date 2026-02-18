import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  Sse,
  HttpException,
  HttpStatus,
  Logger,
  Headers,
  StreamableFile,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

import type { Response } from 'express';
import { Observable, Subject } from 'rxjs';
import { DownloadService, DownloadProgress } from './download.service';
import { DownloadRequestDto } from './dto/download-request.dto';
import { VideoResultDto } from '../youtube/dto/video-result.dto';
import * as path from 'path';
import * as fs from 'fs';

interface TaskInfo {
  subject: Subject<MessageEvent>;
  filePath?: string;
}

@ApiTags('下載')
@Controller('download')
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name);
  private tasks = new Map<string, TaskInfo>();

  constructor(private readonly downloadService: DownloadService) {}

  @Get('formats/:videoId')
  @ApiOperation({ summary: '取得影片可用格式' })
  async getFormats(@Param('videoId') videoId: string) {
    return this.downloadService.getFormats(videoId);
  }

  @Post('parse')
  @ApiOperation({ summary: '解析 YouTube 網址 (影片/清單)' })
  async parseUrl(@Body('url') url: string): Promise<VideoResultDto[]> {
    if (!url) {
      throw new HttpException('網址不能為空', HttpStatus.BAD_REQUEST);
    }
    return this.downloadService.parseUrl(url);
  }

  @Post()
  @ApiOperation({ summary: '下載影片或音樂' })
  async download(@Body() dto: DownloadRequestDto, @Res() res: Response) {
    try {
      const filePath = await this.downloadService.download(
        dto.videoId,
        dto.type,
        dto.quality || 'best',
      );

      const filename = path.basename(filePath);
      const encodedFilename = encodeURIComponent(filename);

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fs.statSync(filePath).size.toString(),
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      // 下載完畢後刪除暫存檔
        // fs.unlink(filePath, (err) => {
        //   if (err) this.logger.warn(`刪除暫存檔失敗: ${filePath}`);
        // });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '下載失敗',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('async')
  @ApiOperation({ summary: '非同步下載（搭配 SSE 進度）' })
  async downloadAsync(@Body() dto: DownloadRequestDto) {
    const taskId = `${dto.videoId}-${Date.now()}`;
    const subject = new Subject<MessageEvent>();

    this.tasks.set(taskId, { subject });

    // 非同步啟動下載
    this.downloadService
      .download(dto.videoId, dto.type, dto.quality || 'best', (progress) => {
        const task = this.tasks.get(taskId);
        if (task) {
          subject.next({
            data: JSON.stringify(progress),
          } as MessageEvent);

          if (progress.status === 'done' || progress.status === 'error') {
            subject.complete();
          }
        }
      })
      .then((filePath) => {
        const task = this.tasks.get(taskId);
        if (task) {
          task.filePath = filePath;
        }
      })
      .catch(() => {
        this.tasks.delete(taskId);
      });

    return { taskId };
  }

  @Sse('progress/:taskId')
  @ApiOperation({ summary: '下載進度（SSE）' })
  progress(@Param('taskId') taskId: string): Observable<MessageEvent> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new HttpException('找不到下載任務', HttpStatus.NOT_FOUND);
    }
    return task.subject.asObservable();
  }
  @Get('files')
  @ApiOperation({ summary: '取得已下載檔案列表' })
  async getFiles() {
    return this.downloadService.listFiles();
  }

  @Get('files/:filename')
  @ApiOperation({ summary: '串流播放檔案' })
  @ApiQuery({ name: 'filename', required: true })
  async streamFile(
    @Param('filename') filename: string,
    @Headers('range') range: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { file, size, contentType, filePath } =
      this.downloadService.getFileStream(filename);

    res.set({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });

    // 處理 Range Header (影片跳轉)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.set({
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': chunksize.toString(),
      });
      res.status(206); // Partial Content
      return new StreamableFile(stream);
    }

    res.set({
      'Content-Length': size.toString(),
    });

    return file;
  }

  @Delete('files/:filename')
  @ApiOperation({ summary: '刪除檔案' })
  async deleteFile(@Param('filename') filename: string) {
    await this.downloadService.deleteFile(filename);
    return { success: true };
  }
}
