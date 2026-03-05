import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { OperationLog } from '../operation-record/operation-log.interceptor';
import { OperationType } from '../operation-record/entities/operation-record.entity';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@ApiTags('YouTube')
@UseGuards(OptionalJwtAuthGuard)
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('search')
  @ApiOperation({ summary: '搜尋 YouTube 影片' })
  @OperationLog(OperationType.SEARCH)
  async search(@Query() query: SearchQueryDto) {
    const results = await this.youtubeService.search(
      query.q,
      query.maxResults ?? 10,
    );
    return { results };
  }
}
