import '../../domain/entities/branch_weekly_score.dart';

/// Data model for branch weekly score, handles JSON serialization.
///
/// Maps API responses to the domain [BranchWeeklyScore] entity via [toEntity].
class BranchWeeklyScoreModel {
  final String branchId;
  final String branchName;
  final DateTime weekStart;
  final int totalScore;
  final double perCapitaScore;
  final int activeMemberCount;
  final int rank;
  final int prevRank;
  final Map<String, dynamic> scoreBreakdown;

  const BranchWeeklyScoreModel({
    required this.branchId,
    required this.branchName,
    required this.weekStart,
    required this.totalScore,
    required this.perCapitaScore,
    required this.activeMemberCount,
    required this.rank,
    required this.prevRank,
    this.scoreBreakdown = const {},
  });

  factory BranchWeeklyScoreModel.fromJson(Map<String, dynamic> json) {
    return BranchWeeklyScoreModel(
      branchId: json['branchId'] as String,
      branchName: json['branchName'] as String,
      weekStart: DateTime.parse(json['weekStart'] as String),
      totalScore: json['totalScore'] as int,
      perCapitaScore: (json['perCapitaScore'] as num).toDouble(),
      activeMemberCount: json['activeMemberCount'] as int,
      rank: json['rank'] as int,
      prevRank: json['prevRank'] as int? ?? json['rank'] as int,
      scoreBreakdown: json['scoreBreakdown'] is Map<String, dynamic>
          ? json['scoreBreakdown'] as Map<String, dynamic>
          : const {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'branchId': branchId,
      'branchName': branchName,
      'weekStart': weekStart.toIso8601String(),
      'totalScore': totalScore,
      'perCapitaScore': perCapitaScore,
      'activeMemberCount': activeMemberCount,
      'rank': rank,
      'prevRank': prevRank,
      'scoreBreakdown': scoreBreakdown,
    };
  }

  BranchWeeklyScore toEntity() {
    return BranchWeeklyScore(
      branchId: branchId,
      branchName: branchName,
      weekStart: weekStart,
      totalScore: totalScore,
      perCapitaScore: perCapitaScore,
      activeMemberCount: activeMemberCount,
      rank: rank,
      prevRank: prevRank,
      scoreBreakdown: scoreBreakdown,
    );
  }
}
