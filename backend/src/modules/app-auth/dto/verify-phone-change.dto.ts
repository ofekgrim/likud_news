import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class VerifyPhoneChangeDto {
  @ApiProperty({ description: 'New phone number in E.164 format', example: '+972501234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Phone must be in E.164 format' })
  phone: string;

  @ApiProperty({ description: '6-digit verification code', example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}
