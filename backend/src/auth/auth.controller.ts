import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OperationRecordService } from '../operation-record/operation-record.service';
import { OperationType } from '../operation-record/entities/operation-record.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@ApiTags('認證')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly operationRecordService: OperationRecordService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '註冊新帳號' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    await this.operationRecordService.create(
      result.user.id,
      OperationType.REGISTER,
      `註冊帳號：${dto.username}`,
    );
    return result;
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '登入' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    await this.operationRecordService.create(
      result.user.id,
      OperationType.LOGIN,
      `登入帳號：${dto.username}`,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得目前登入使用者資訊' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
