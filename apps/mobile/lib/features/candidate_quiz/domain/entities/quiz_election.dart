import 'package:equatable/equatable.dart';

/// Represents an election that has quiz questions available.
class QuizElection extends Equatable {
  final String id;
  final String title;
  final String? description;
  final String status;
  final int questionCount;
  final int candidateCount;
  final bool hasCompleted;
  final DateTime? completedAt;

  const QuizElection({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.questionCount,
    required this.candidateCount,
    required this.hasCompleted,
    this.completedAt,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        status,
        questionCount,
        candidateCount,
        hasCompleted,
        completedAt,
      ];
}
