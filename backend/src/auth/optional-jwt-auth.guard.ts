import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可選的 JWT 認證 Guard
 * - 有合法 token → 解析並設定 request.user
 * - 無 token 或 token 無效 → 不擋請求，request.user 為 null
 *
 * 用於公開 API，讓已登入用戶的操作也能被記錄
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // JWT 驗證失敗（無 token 或 token 無效），不擋請求
    }
    return true;
  }

  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
