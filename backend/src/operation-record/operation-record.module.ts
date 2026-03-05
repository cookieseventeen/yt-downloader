import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationRecord } from './entities/operation-record.entity';
import { OperationRecordService } from './operation-record.service';
import { OperationRecordController } from './operation-record.controller';
import { OperationLogInterceptor } from './operation-log.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([OperationRecord])],
  controllers: [OperationRecordController],
  providers: [OperationRecordService, OperationLogInterceptor],
  exports: [OperationRecordService, OperationLogInterceptor],
})
export class OperationRecordModule {}
