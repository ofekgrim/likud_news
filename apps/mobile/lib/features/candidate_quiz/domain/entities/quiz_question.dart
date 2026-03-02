import 'package:equatable/equatable.dart';

/// Represents a single selectable option within a quiz question.
class QuizOption extends Equatable {
  final String label;
  final double value;

  const QuizOption({
    required this.label,
    required this.value,
  });

  @override
  List<Object?> get props => [label, value];
}

/// Immutable quiz question entity used throughout the domain and presentation layers.
class QuizQuestion extends Equatable {
  final String id;
  final String electionId;
  final String questionText;
  final List<QuizOption> options;
  final String importance; // low, medium, high
  final String? category;
  final int sortOrder;

  const QuizQuestion({
    required this.id,
    required this.electionId,
    required this.questionText,
    required this.options,
    required this.importance,
    this.category,
    required this.sortOrder,
  });

  @override
  List<Object?> get props => [
        id,
        electionId,
        questionText,
        options,
        importance,
        category,
        sortOrder,
      ];
}
