import 'package:equatable/equatable.dart';

/// The category of a policy statement.
enum PolicyCategory {
  security,
  economy,
  judiciary,
  housing,
  social,
  foreign,
}

/// Immutable domain entity representing a policy statement
/// that users agree/disagree with in the candidate matcher quiz.
class PolicyStatement extends Equatable {
  final String id;
  final String textHe;
  final String? textEn;
  final PolicyCategory category;
  final double defaultWeight;
  final int sortOrder;

  const PolicyStatement({
    required this.id,
    required this.textHe,
    this.textEn,
    required this.category,
    this.defaultWeight = 1.0,
    this.sortOrder = 0,
  });

  @override
  List<Object?> get props => [id, textHe, textEn, category, defaultWeight, sortOrder];
}
