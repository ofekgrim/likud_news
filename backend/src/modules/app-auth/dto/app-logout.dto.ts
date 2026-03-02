import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppLogoutDto {
  @ApiProperty({ description: 'Device identifier to revoke tokens for' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
