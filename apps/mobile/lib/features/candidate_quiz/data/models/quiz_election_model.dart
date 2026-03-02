import '../../domain/entities/quiz_election.dart';

/// Data model for quiz election list items.
class QuizElectionModel {
  final String id;
  final String title;
  final String? description;
  final String status;
  final int questionCount;
  final int candidateCount;
  final bool hasCompleted;
  final String? completedAt;

  const QuizElectionModel({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.questionCount,
    required this.candidateCount,
    required this.hasCompleted,
    this.completedAt,
  });

  factory QuizElectionModel.fromJson(Map<String, dynamic> json) {
    return QuizElectionModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: json['status'] as String,
      questionCount: json['questionCount'] as int? ?? 0,
      candidateCount: json['candidateCount'] as int? ?? 0,
      hasCompleted: json['hasCompleted'] as bool? ?? false,
      completedAt: json['completedAt'] as String?,
    );
  }

  QuizElection toEntity() {
    return QuizElection(
      id: id,
      title: title,
      description: description,
      status: status,
      questionCount: questionCount,
      candidateCount: candidateCount,
      hasCompleted: hasCompleted,
      completedAt: completedAt != null ? DateTime.tryParse(completedAt!) : null,
    );
  }
}
