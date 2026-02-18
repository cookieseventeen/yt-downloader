import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DownloadRequestDto {
  @ApiProperty({ description: '影片 ID', example: 'QEFAz34wJo4' })
  @IsString()
  videoId: string;

  @ApiProperty({
    description: '下載類型',
    enum: ['video', 'audio'],
    example: 'audio',
  })
  @IsIn(['video', 'audio'])
  type: 'video' | 'audio';

  @ApiProperty({
    description: '畫質/音質',
    default: 'best',
    required: false,
  })
  @IsOptional()
  @IsString()
  quality?: string = 'best';
}
