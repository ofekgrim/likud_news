import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PollOptionDto {
  @ApiProperty({ description: 'Option label text' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class CreatePollDto {
  @ApiProperty({ description: 'Poll question' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ description: 'Poll description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Poll options', type: [PollOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options: PollOptionDto[];

  @ApiPropertyOptional({ description: 'Whether the poll is pinned', default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
