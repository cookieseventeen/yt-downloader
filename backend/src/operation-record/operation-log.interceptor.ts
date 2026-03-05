import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { OperationRecordService } from './operation-record.service';
import { OperationType } from './entities/operation-record.entity';

export const OPERATION_TYPE_KEY = 'operationType';
export const OperationLog = (type: OperationType) =>
  SetMetadata(OPERATION_TYPE_KEY, type);

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly operationRecordService: OperationRecordService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const operationType = this.reflector.get<OperationType>(
      OPERATION_TYPE_KEY,
      context.getHandler(),
    );

    if (!operationType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      return next.handle();
    }

    const ip =
      request.headers['x-forwarded-for'] || request.socket?.remoteAddress;

    return next.handle().pipe(
      tap(() => {
        const detail = this.buildDetail(operationType, request);
        this.operationRecordService
          .create(user.userId, operationType, detail, ip)
          .catch(() => {});
      }),
    );
  }

  private buildDetail(type: OperationType, request: any): string {
    switch (type) {
      case OperationType.SEARCH:
        return `搜尋：${request.query?.q || ''}`;
      case OperationType.DOWNLOAD:
        return `下載：${request.body?.videoId || ''} (${request.body?.type || ''})`;
      case OperationType.PARSE_URL:
        return `解析網址：${request.body?.url || ''}`;
      case OperationType.DELETE_FILE:
        return `刪除檔案：${request.params?.filename || ''}`;
      case OperationType.VIEW_LIBRARY:
        return '瀏覽媒體庫';
      case OperationType.VIEW_FORMATS:
        return `查看格式：${request.params?.videoId || ''}`;
      default:
        return '';
    }
  }
}
