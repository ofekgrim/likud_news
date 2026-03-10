import 'package:equatable/equatable.dart';

/// Represents a user's answer to a single quiz question.
///
/// [selectedValue] is the numeric value of the chosen option.
/// [importance] is 1 (low), 2 (medium), or 3 (high).
class QuizAnswer extends Equatable {
  final String questionId;
  final double selectedValue;
  final int importance; // 1, 2, or 3

  const QuizAnswer({
    required this.questionId,
    required this.selectedValue,
    required this.importance,
  });

  /// Creates a copy with optional field overrides.
  QuizAnswer copyWith({
    String? questionId,
    double? selectedValue,
    int? importance,
  }) {
    return QuizAnswer(
      questionId: questionId ?? this.questionId,
      selectedValue: selectedValue ?? this.selectedValue,
      importance: importance ?? this.importance,
    );
  }

  @override
  List<Object?> get props => [questionId, selectedValue, importance];
}
