import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({ description: 'New email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Current account password for verification' })
  @IsString()
  @MinLength(6)
  currentPassword: string;
}
