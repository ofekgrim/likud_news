import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { DonationRecipientType } from '../entities/donation.entity';

export class CreateDonationDto {
  @IsEnum(DonationRecipientType)
  recipientType: DonationRecipientType;

  @IsOptional()
  @IsUUID()
  recipientCandidateId?: string;

  @IsNumber()
  @Min(1)
  @Max(11377)
  amountNis: number;

  @IsString()
  @Length(64, 64)
  teutatZehutHash: string;
}
