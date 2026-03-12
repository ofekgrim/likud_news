import { IsString, IsUUID } from 'class-validator';

export class ConfirmDonationDto {
  @IsUUID()
  donationId: string;

  @IsString()
  paymentIntentId: string;
}
