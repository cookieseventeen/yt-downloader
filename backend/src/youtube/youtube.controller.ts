import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('YouTube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('search')
  @ApiOperation({ summary: '搜尋 YouTube 影片' })
  async search(@Query() query: SearchQueryDto) {
    const results = await this.youtubeService.search(
      query.q,
      query.maxResults ?? 10,
    );
    return { results };
  }
}
