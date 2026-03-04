import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OperationRecord,
  OperationType,
} from './entities/operation-record.entity';

@Injectable()
export class OperationRecordService {
  constructor(
    @InjectRepository(OperationRecord)
    private readonly recordRepo: Repository<OperationRecord>,
  ) {}

  async create(
    userId: number,
    type: OperationType,
    detail?: string,
    ipAddress?: string,
  ) {
    const record = this.recordRepo.create({
      userId,
      type,
      detail,
      ipAddress,
    });
    return this.recordRepo.save(record);
  }

  async findByUser(
    userId: number,
    options: { type?: string; page: number; limit: number },
  ) {
    const { type, page, limit } = options;
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const [items, total] = await this.recordRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
