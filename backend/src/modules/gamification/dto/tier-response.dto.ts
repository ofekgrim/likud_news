import { ApiProperty } from '@nestjs/swagger';

export class LockedFeatureDto {
  @ApiProperty({ example: 'mk_qa' })
  feature: string;

  @ApiProperty({ example: 4 })
  requiredTier: number;

  @ApiProperty({ example: 'גנרל' })
  requiredTierName: string;
}

export class TierResponseDto {
  @ApiProperty({ example: 3 })
  currentTier: number;

  @ApiProperty({ example: 'שגריר' })
  tierName: string;

  @ApiProperty({ example: 'Ambassador' })
  tierNameEn: string;

  @ApiProperty({ example: 3500 })
  totalXp: number;

  @ApiProperty({ example: 7500, nullable: true })
  nextTierXp: number | null;

  @ApiProperty({ example: 0.467 })
  progressToNextTier: number;

  @ApiProperty({ example: ['ama_early_access', 'vip_events'] })
  unlockedFeatures: string[];

  @ApiProperty({ type: [LockedFeatureDto] })
  lockedFeatures: LockedFeatureDto[];
}
