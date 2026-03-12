import 'package:equatable/equatable.dart';

/// Immutable entity representing the current turnout data for the gauge widget.
class TurnoutData extends Equatable {
  final int totalEligible;
  final int totalVoters;
  final double turnoutPercentage;
  final DateTime lastUpdated;

  const TurnoutData({
    required this.totalEligible,
    required this.totalVoters,
    required this.turnoutPercentage,
    required this.lastUpdated,
  });

  TurnoutData copyWith({
    int? totalEligible,
    int? totalVoters,
    double? turnoutPercentage,
    DateTime? lastUpdated,
  }) {
    return TurnoutData(
      totalEligible: totalEligible ?? this.totalEligible,
      totalVoters: totalVoters ?? this.totalVoters,
      turnoutPercentage: turnoutPercentage ?? this.turnoutPercentage,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  @override
  List<Object?> get props => [
        totalEligible,
        totalVoters,
        turnoutPercentage,
        lastUpdated,
      ];
}
