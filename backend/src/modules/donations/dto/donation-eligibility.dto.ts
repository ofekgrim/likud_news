export class DonationEligibilityDto {
  eligible: boolean;
  remainingCandidateCap: number;
  remainingPartyCap: number;
  reason?: string;
}
