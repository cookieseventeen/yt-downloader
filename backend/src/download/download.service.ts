import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { StreamableFile } from '@nestjs/common';
import { VideoResultDto } from '../youtube/dto/video-result.dto';


export interface DownloadProgress {
  progress: number;
  speed: string;
  eta: string;
  status: 'downloading' | 'processing' | 'done' | 'error';
  filename?: string;
}

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly downloadDir: string;

  constructor(private configService: ConfigService) {
    this.downloadDir =
      this.configService.get<string>('DOWNLOAD_DIR') ||
      path.join(process.cwd(), 'downloads');

    // 確保下載目錄存在
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * 取得影片可用格式
   */
  async getFormats(videoId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-download',
        `https://www.youtube.com/watch?v=${videoId}`,
      ];

      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`yt-dlp 格式查詢失敗: ${stderr}`);
          reject(
            new HttpException(
              `取得影片格式失敗：${stderr}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
          return;
        }

        try {
          const info = JSON.parse(stdout);
          const videoFormats = (info.formats || [])
            .filter(
              (f: any) =>
                f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4',
            )
            .map((f: any) => ({
              formatId: f.format_id,
              quality: f.format_note || f.resolution || '未知',
              ext: f.ext,
              size: f.filesize
                ? `${(f.filesize / 1024 / 1024).toFixed(1)}MB`
                : '未知',
            }));

          const audioFormats = (info.formats || [])
            .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
            .map((f: any) => ({
              formatId: f.format_id,
              quality: f.abr ? `${f.abr}kbps` : '未知',
              ext: f.ext,
              size: f.filesize
                ? `${(f.filesize / 1024 / 1024).toFixed(1)}MB`
                : '未知',
            }));

          resolve({
            title: info.title,
            duration: info.duration_string || '未知',
            thumbnail: info.thumbnail,
            formats: {
              video: videoFormats,
              audio: audioFormats,
            },
          });
        } catch {
          reject(
            new HttpException(
              '解析影片格式失敗',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        }
      });
    });
  }

  /**
   * 下載影片或音樂，回傳檔案路徑
   */
  async download(
    videoId: string,
    type: 'video' | 'audio',
    quality: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputTemplate = path.join(
        this.downloadDir,
        '%(title)s.%(ext)s',
      );

      let args: string[];

      if (type === 'audio') {
        args = [
          '-f', 'bestaudio',
          '-x',
          '--audio-format', 'mp3',
          '--audio-quality', '0',
          '-o', outputTemplate,
          '--newline',
          '--no-playlist',
          `https://www.youtube.com/watch?v=${videoId}`,
        ];
      } else {
        const formatSpec =
          quality === 'best'
            ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            : quality;

        args = [
          '-f', formatSpec,
          '--merge-output-format', 'mp4',
          '-o', outputTemplate,
          '--newline',
          '--no-playlist',
          `https://www.youtube.com/watch?v=${videoId}`,
        ];
      }

      this.logger.log(`開始下載：yt-dlp ${args.join(' ')}`);
      const proc = spawn('yt-dlp', args);
      let lastFilename = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const line = data.toString().trim();
        this.logger.debug(line);

        // 解析下載進度
        const progressMatch = line.match(
          /\[download\]\s+([\d.]+)%\s+of\s+~?\s*[\d.]+\w+\s+at\s+([\d.]+\w+\/s)\s+ETA\s+(\S+)/,
        );
        if (progressMatch && onProgress) {
          onProgress({
            progress: parseFloat(progressMatch[1]),
            speed: progressMatch[2],
            eta: progressMatch[3],
            status: 'downloading',
          });
        }

        // 解析目標檔名
        const destMatch = line.match(
          /\[(?:Merger|ExtractAudio|download)\]\s+Destination:\s+(.+)/,
        );
        if (destMatch) {
          lastFilename = destMatch[1].trim();
        }

        // 已存在的檔案
        const alreadyMatch = line.match(
          /\[download\]\s+(.+)\s+has already been downloaded/,
        );
        if (alreadyMatch) {
          lastFilename = alreadyMatch[1].trim();
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.warn(`yt-dlp stderr: ${data.toString()}`);
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`yt-dlp 下載失敗 (code ${code}): ${stderr}`);
          if (onProgress) {
            onProgress({
              progress: 0,
              speed: '',
              eta: '',
              status: 'error',
            });
          }
          reject(
            new HttpException(
              `下載失敗：${stderr || '未知錯誤'}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
          return;
        }

        // 嘗試找到實際產出的檔案
        let outputPath = lastFilename;
        if (!outputPath || !fs.existsSync(outputPath)) {
          // 尋找最新下載的檔案
          const files = fs.readdirSync(this.downloadDir);
          if (files.length > 0) {
            const sorted = files
              .map((f) => ({
                name: f,
                time: fs.statSync(path.join(this.downloadDir, f)).mtimeMs,
              }))
              .sort((a, b) => b.time - a.time);
            outputPath = path.join(this.downloadDir, sorted[0].name);
          }
        }

        if (outputPath && fs.existsSync(outputPath)) {
          this.logger.log(`下載完成：${outputPath}`);
          if (onProgress) {
            onProgress({
              progress: 100,
              speed: '',
              eta: '',
              status: 'done',
              filename: path.basename(outputPath),
            });
          }
          resolve(outputPath);
        } else {
          reject(
            new HttpException(
              '下載完成但找不到檔案',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        }
      });
    });
  }
  /**
   * 取得下載目錄下的所有檔案
   */
  async listFiles(): Promise<any[]> {
    if (!fs.existsSync(this.downloadDir)) {
      return [];
    }

    const files = fs.readdirSync(this.downloadDir);
    return files
      .filter((file) => !file.startsWith('.')) // 排除隱藏檔
      .map((file) => {
        const filePath = path.join(this.downloadDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          updatedAt: stats.mtime,
          type: file.endsWith('.mp3') ? 'audio' : 'video',
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * 取得檔案串流
   */
  getFileStream(filename: string): {
    file: StreamableFile;
    size: number;
    contentType: string;
    filePath: string;
  } {
    const filePath = path.join(this.downloadDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new HttpException('檔案不存在', HttpStatus.NOT_FOUND);
    }

    const stats = fs.statSync(filePath);
    const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';
    const file = fs.createReadStream(filePath);

    return {
      file: new StreamableFile(file),
      size: stats.size,
      contentType,
      filePath,
    };
  }

  /**
   * 刪除檔案
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.downloadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

    /**
   * 解析 YouTube 網址 (影片或播放清單)
   * 使用 yt-dlp --dump-single-json --flat-playlist
   */
  async parseUrl(url: string): Promise<VideoResultDto[]> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-single-json',
        '--flat-playlist',
        '--no-warnings',
        url,
      ];

      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`yt-dlp 解析失敗: ${stderr}`);
          reject(
            new HttpException(
              `解析失敗，請確認網址正確：${stderr}`,
              HttpStatus.BAD_REQUEST,
            ),
          );
          return;
        }

        try {
          const info = JSON.parse(stdout);
          const results: VideoResultDto[] = [];

          if (info._type === 'playlist') {
            // 播放清單
            for (const entry of info.entries) {
              if (!entry) continue;
              results.push(this.mapToVideoResult(entry));
            }
          } else {
            // 單一影片
            results.push(this.mapToVideoResult(info));
          }

          resolve(results);
        } catch (e) {
          this.logger.error(`解析 yt-dlp 輸出失敗: ${e}`);
          reject(
            new HttpException(
              '解析回應失敗',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        }
      });
    });
  }

  private mapToVideoResult(info: any): VideoResultDto {
    return {
      videoId: info.id,
      title: info.title,
      channel: info.uploader || info.channel || '未知頻道',
      thumbnail:
        info.thumbnail ||
        `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`, // Fallback thumbnail
      duration: info.duration_string || this.formatDuration(info.duration),
      publishedAt: info.upload_date
        ? this.formatDate(info.upload_date)
        : '',
      viewCount: info.view_count?.toString() || '0',
    };
  }

  private formatDuration(seconds: number): string {
    if (!seconds) return '未知';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private formatDate(dateStr: string): string {
    // yt-dlp upload_date is usually YYYYMMDD
    if (/^\d{8}$/.test(dateStr)) {
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  }
}

