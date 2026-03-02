import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { PointAction } from '../entities/user-points.entity';

export class AwardPointsDto {
  @ApiProperty({ description: 'User UUID' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Action that earned the points',
    enum: PointAction,
    example: PointAction.QUIZ_COMPLETE,
  })
  @IsEnum(PointAction)
  action: PointAction;

  @ApiProperty({ description: 'Number of points to award', minimum: 1 })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiPropertyOptional({ description: 'Additional metadata (JSONB)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
