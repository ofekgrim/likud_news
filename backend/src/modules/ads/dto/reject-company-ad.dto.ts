import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectCompanyAdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
