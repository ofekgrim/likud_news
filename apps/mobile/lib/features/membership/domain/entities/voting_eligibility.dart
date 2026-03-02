import 'package:equatable/equatable.dart';

/// Immutable voting eligibility entity for upcoming elections.
///
/// Represents whether the user is eligible to vote in the next
/// Likud election, with reason and registration details.
class VotingEligibility extends Equatable {
  final bool isEligible;
  final String? reason;
  final String? electionName;
  final DateTime? registrationDeadline;

  const VotingEligibility({
    required this.isEligible,
    this.reason,
    this.electionName,
    this.registrationDeadline,
  });

  @override
  List<Object?> get props => [
        isEligible,
        reason,
        electionName,
        registrationDeadline,
      ];
}
