import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '使用者名稱', example: 'john' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ description: '密碼', example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({ description: '顯示名稱', required: false, example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;
}
