import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '使用者名稱', example: 'john' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密碼', example: 'password123' })
  @IsString()
  password: string;
}
