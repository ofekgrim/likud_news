import 'package:equatable/equatable.dart';

/// Represents a feature that is locked behind a tier gate.
class LockedFeature extends Equatable {
  final String feature;
  final int requiredTier;
  final String requiredTierName;

  const LockedFeature({
    required this.feature,
    required this.requiredTier,
    required this.requiredTierName,
  });

  @override
  List<Object?> get props => [feature, requiredTier, requiredTierName];
}

/// Immutable entity representing the user's tier progression status.
class TierInfo extends Equatable {
  final int currentTier;
  final String tierName;
  final String tierNameEn;
  final int totalXp;
  final int? nextTierXp;
  final double progressToNextTier;
  final List<String> unlockedFeatures;
  final List<LockedFeature> lockedFeatures;

  const TierInfo({
    this.currentTier = 1,
    this.tierName = '',
    this.tierNameEn = '',
    this.totalXp = 0,
    this.nextTierXp,
    this.progressToNextTier = 0.0,
    this.unlockedFeatures = const [],
    this.lockedFeatures = const [],
  });

  @override
  List<Object?> get props => [
        currentTier,
        tierName,
        tierNameEn,
        totalXp,
        nextTierXp,
        progressToNextTier,
        unlockedFeatures,
        lockedFeatures,
      ];
}
