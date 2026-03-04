import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationRecord } from './entities/operation-record.entity';
import { OperationRecordService } from './operation-record.service';
import { OperationRecordController } from './operation-record.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperationRecord])],
  controllers: [OperationRecordController],
  providers: [OperationRecordService],
  exports: [OperationRecordService],
})
export class OperationRecordModule {}
