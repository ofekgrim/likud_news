import { IsString, IsOptional, IsUUID } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  appUserId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
