import { IsOptional, IsEnum } from 'class-validator';

export enum SummarizeMode {
  BRIEF = 'brief',
  POLITICAL = 'political',
  FULL = 'full',
}

export class SummarizeQueryDto {
  @IsOptional()
  @IsEnum(SummarizeMode)
  mode?: SummarizeMode;
}
