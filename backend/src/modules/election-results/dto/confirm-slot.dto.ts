import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class ConfirmSlotDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'Knesset seat position (1-120)', minimum: 1, maximum: 120 })
  @IsInt()
  @Min(1)
  @Max(120)
  slotNumber: number;
}
