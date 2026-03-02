import '../../domain/entities/turnout_snapshot.dart';

/// Data model for turnout snapshots, handles JSON serialization.
///
/// Maps API responses to the domain [TurnoutSnapshot] entity via [toEntity].
class TurnoutSnapshotModel {
  final String id;
  final String electionId;
  final String? district;
  final int eligibleVoters;
  final int actualVoters;
  final double percentage;
  final DateTime snapshotAt;

  const TurnoutSnapshotModel({
    required this.id,
    required this.electionId,
    this.district,
    required this.eligibleVoters,
    required this.actualVoters,
    required this.percentage,
    required this.snapshotAt,
  });

  factory TurnoutSnapshotModel.fromJson(Map<String, dynamic> json) {
    return TurnoutSnapshotModel(
      id: json['id'] as String,
      electionId: json['electionId'] as String,
      district: json['district'] as String?,
      eligibleVoters: json['eligibleVoters'] != null
          ? int.tryParse(json['eligibleVoters'].toString()) ?? 0
          : 0,
      actualVoters: json['actualVoters'] != null
          ? int.tryParse(json['actualVoters'].toString()) ?? 0
          : 0,
      percentage: json['percentage'] != null
          ? double.tryParse(json['percentage'].toString()) ?? 0.0
          : 0.0,
      snapshotAt: json['snapshotAt'] != null
          ? DateTime.parse(json['snapshotAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'electionId': electionId,
      'district': district,
      'eligibleVoters': eligibleVoters,
      'actualVoters': actualVoters,
      'percentage': percentage,
      'snapshotAt': snapshotAt.toIso8601String(),
    };
  }

  TurnoutSnapshot toEntity() {
    return TurnoutSnapshot(
      id: id,
      electionId: electionId,
      district: district,
      eligibleVoters: eligibleVoters,
      actualVoters: actualVoters,
      percentage: percentage,
      snapshotAt: snapshotAt,
    );
  }
}
