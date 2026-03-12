import '../../domain/entities/turnout_data.dart';

/// Data model for turnout data, handles JSON serialization.
///
/// Maps WebSocket / API JSON payloads to the domain [TurnoutData] entity.
class TurnoutDataModel {
  final int totalEligible;
  final int totalVoters;
  final double turnoutPercentage;
  final DateTime lastUpdated;

  const TurnoutDataModel({
    required this.totalEligible,
    required this.totalVoters,
    required this.turnoutPercentage,
    required this.lastUpdated,
  });

  factory TurnoutDataModel.fromJson(Map<String, dynamic> json) {
    return TurnoutDataModel(
      totalEligible: json['totalEligible'] != null
          ? int.tryParse(json['totalEligible'].toString()) ?? 0
          : 0,
      totalVoters: json['totalVoters'] != null
          ? int.tryParse(json['totalVoters'].toString()) ?? 0
          : json['actualVoters'] != null
              ? int.tryParse(json['actualVoters'].toString()) ?? 0
              : 0,
      turnoutPercentage: json['turnoutPercentage'] != null
          ? double.tryParse(json['turnoutPercentage'].toString()) ?? 0.0
          : json['percentage'] != null
              ? double.tryParse(json['percentage'].toString()) ?? 0.0
              : 0.0,
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.tryParse(json['lastUpdated'].toString()) ?? DateTime.now()
          : json['snapshotAt'] != null
              ? DateTime.tryParse(json['snapshotAt'].toString()) ??
                  DateTime.now()
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalEligible': totalEligible,
      'totalVoters': totalVoters,
      'turnoutPercentage': turnoutPercentage,
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  TurnoutData toEntity() {
    return TurnoutData(
      totalEligible: totalEligible,
      totalVoters: totalVoters,
      turnoutPercentage: turnoutPercentage,
      lastUpdated: lastUpdated,
    );
  }
}
