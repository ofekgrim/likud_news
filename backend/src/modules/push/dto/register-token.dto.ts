import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTokenDto {
  @ApiProperty({ example: 'device-abc-123', description: 'Unique device identifier' })
  @IsString()
  deviceId: string;

  @ApiProperty({ example: 'fcm-token-xyz', description: 'Push notification token' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'ios', description: 'Device platform (ios, android, web)' })
  @IsString()
  platform: string;
}
