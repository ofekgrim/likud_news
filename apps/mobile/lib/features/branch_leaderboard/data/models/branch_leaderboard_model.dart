import '../../domain/entities/branch_leaderboard.dart';
import 'branch_weekly_score_model.dart';

/// Data model for the branch leaderboard, handles JSON serialization.
///
/// Maps API responses to the domain [BranchLeaderboard] entity via [toEntity].
class BranchLeaderboardModel {
  final List<BranchWeeklyScoreModel> scores;
  final DateTime weekStart;
  final String? myBranchId;
  final int? myBranchRank;

  const BranchLeaderboardModel({
    required this.scores,
    required this.weekStart,
    this.myBranchId,
    this.myBranchRank,
  });

  factory BranchLeaderboardModel.fromJson(Map<String, dynamic> json) {
    final scoresRaw = json['scores'] as List<dynamic>? ??
        json['data'] as List<dynamic>? ??
        [];
    final scores = scoresRaw
        .map((s) =>
            BranchWeeklyScoreModel.fromJson(s as Map<String, dynamic>))
        .toList();

    return BranchLeaderboardModel(
      scores: scores,
      weekStart: json['weekStart'] != null
          ? DateTime.parse(json['weekStart'] as String)
          : DateTime.now(),
      myBranchId: json['myBranchId'] as String?,
      myBranchRank: json['myBranchRank'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'scores': scores.map((s) => s.toJson()).toList(),
      'weekStart': weekStart.toIso8601String(),
      'myBranchId': myBranchId,
      'myBranchRank': myBranchRank,
    };
  }

  BranchLeaderboard toEntity() {
    return BranchLeaderboard(
      scores: scores.map((s) => s.toEntity()).toList(),
      weekStart: weekStart,
      myBranchId: myBranchId,
      myBranchRank: myBranchRank,
    );
  }
}
