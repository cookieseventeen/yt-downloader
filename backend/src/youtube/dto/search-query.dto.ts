import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ description: '搜尋關鍵字', example: '周杰倫' })
  @IsString()
  q: string;

  @ApiProperty({ description: '搜尋結果數量', default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxResults?: number = 10;
}
