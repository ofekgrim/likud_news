import '../../domain/entities/voting_eligibility.dart';

/// Data model for voting eligibility, handles JSON serialization.
///
/// Maps API responses from `/elections` (active) to the domain
/// [VotingEligibility] entity via [toEntity].
class VotingEligibilityModel {
  final bool isEligible;
  final String? reason;
  final String? electionName;
  final DateTime? registrationDeadline;

  const VotingEligibilityModel({
    required this.isEligible,
    this.reason,
    this.electionName,
    this.registrationDeadline,
  });

  /// Creates a [VotingEligibilityModel] from a JSON map.
  ///
  /// Handles both `{data: {...}}` wrapper and raw `{...}` responses.
  factory VotingEligibilityModel.fromJson(Map<String, dynamic> json) {
    final data = json.containsKey('data')
        ? json['data'] as Map<String, dynamic>
        : json;

    return VotingEligibilityModel(
      isEligible: data['isEligible'] as bool? ?? false,
      reason: data['reason'] as String?,
      electionName: data['electionName'] as String? ?? data['name'] as String?,
      registrationDeadline: data['registrationDeadline'] != null
          ? DateTime.tryParse(data['registrationDeadline'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isEligible': isEligible,
      'reason': reason,
      'electionName': electionName,
      'registrationDeadline': registrationDeadline?.toIso8601String(),
    };
  }

  VotingEligibility toEntity() {
    return VotingEligibility(
      isEligible: isEligible,
      reason: reason,
      electionName: electionName,
      registrationDeadline: registrationDeadline,
    );
  }
}
