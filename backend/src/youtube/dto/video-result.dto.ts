import { ApiProperty } from '@nestjs/swagger';

export class VideoResultDto {
  @ApiProperty({ description: '影片 ID' })
  videoId: string;

  @ApiProperty({ description: '影片標題' })
  title: string;

  @ApiProperty({ description: '頻道名稱' })
  channel: string;

  @ApiProperty({ description: '縮圖網址' })
  thumbnail: string;

  @ApiProperty({ description: '影片時長' })
  duration: string;

  @ApiProperty({ description: '發布時間' })
  publishedAt: string;

  @ApiProperty({ description: '觀看次數' })
  viewCount: string;
}
