import '../../domain/entities/leaderboard_entry.dart';

/// Data model for leaderboard entries, handles JSON serialization.
///
/// Maps API responses to the domain [LeaderboardEntry] entity via [toEntity].
class LeaderboardEntryModel {
  final String userId;
  final String displayName;
  final String? avatarUrl;
  final int totalPoints;
  final int rank;

  const LeaderboardEntryModel({
    required this.userId,
    required this.displayName,
    this.avatarUrl,
    required this.totalPoints,
    required this.rank,
  });

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntryModel(
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      totalPoints: json['totalPoints'] as int,
      rank: json['rank'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'totalPoints': totalPoints,
      'rank': rank,
    };
  }

  LeaderboardEntry toEntity() {
    return LeaderboardEntry(
      userId: userId,
      displayName: displayName,
      avatarUrl: avatarUrl,
      totalPoints: totalPoints,
      rank: rank,
    );
  }
}
