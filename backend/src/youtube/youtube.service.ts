import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VideoResultDto } from './dto/video-result.dto';

@Injectable()
export class YoutubeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY 環境變數未設定');
    }
  }

  /**
   * 搜尋 YouTube 影片
   */
  async search(query: string, maxResults: number): Promise<VideoResultDto[]> {
    try {
      // 步驟1：搜尋影片
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          key: this.apiKey,
        },
      });

      const items = searchResponse.data.items;
      if (!items || items.length === 0) {
        return [];
      }

      // 步驟2：取得影片詳細資訊（時長、觀看次數）
      const videoIds = items.map((item: any) => item.id.videoId).join(',');
      const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'contentDetails,statistics',
          id: videoIds,
          key: this.apiKey,
        },
      });

      const detailsMap = new Map<string, any>();
      for (const detail of detailsResponse.data.items) {
        detailsMap.set(detail.id, detail);
      }

      // 步驟3：組合結果
      return items.map((item: any) => {
        const detail = detailsMap.get(item.id.videoId);
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url,
          duration: detail
            ? this.parseDuration(detail.contentDetails.duration)
            : '未知',
          publishedAt: item.snippet.publishedAt,
          viewCount: detail?.statistics?.viewCount || '0',
        };
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(
          `YouTube API 錯誤：${error.response.data?.error?.message || '未知錯誤'}`,
          error.response.status,
        );
      }
      throw new HttpException(
        '搜尋 YouTube 影片時發生錯誤',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 將 ISO 8601 時長格式轉為可讀字串
   * 例如 PT3M45S → 3:45
   */
  private parseDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    const paddedSeconds = seconds.toString().padStart(2, '0');
    if (hours > 0) {
      const paddedMinutes = minutes.toString().padStart(2, '0');
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${minutes}:${paddedSeconds}`;
  }
}
