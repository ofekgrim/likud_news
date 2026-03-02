import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailChangeDto {
  @ApiProperty({ description: 'New email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6-digit verification code', example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}
