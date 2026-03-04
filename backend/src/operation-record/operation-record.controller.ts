import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperationRecordService } from './operation-record.service';
import { QueryOperationsDto } from './dto/query-operations.dto';

@ApiTags('操作紀錄')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operations')
export class OperationRecordController {
  constructor(
    private readonly operationRecordService: OperationRecordService,
  ) {}

  @Get()
  @ApiOperation({ summary: '取得我的操作紀錄' })
  async getMyRecords(
    @Request() req: any,
    @Query() query: QueryOperationsDto,
  ) {
    return this.operationRecordService.findByUser(req.user.userId, {
      type: query.type,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
