import 'package:equatable/equatable.dart';

/// Immutable entity representing a daily quiz.
class DailyQuiz extends Equatable {
  final String id;
  final DateTime date;
  final List<DailyQuizQuestion> questions;
  final bool isActive;
  final int pointsReward;
  final bool userHasCompleted;
  final int? userScore;

  const DailyQuiz({
    required this.id,
    required this.date,
    required this.questions,
    required this.isActive,
    required this.pointsReward,
    required this.userHasCompleted,
    this.userScore,
  });

  @override
  List<Object?> get props => [
        id,
        date,
        questions,
        isActive,
        pointsReward,
        userHasCompleted,
        userScore,
      ];
}

/// A single question within a daily quiz.
class DailyQuizQuestion extends Equatable {
  final String questionText;
  final List<DailyQuizOption> options;
  final String? linkedArticleId;
  final String? linkedArticleSlug;

  const DailyQuizQuestion({
    required this.questionText,
    required this.options,
    this.linkedArticleId,
    this.linkedArticleSlug,
  });

  @override
  List<Object?> get props => [
        questionText,
        options,
        linkedArticleId,
        linkedArticleSlug,
      ];
}

/// A single option within a daily quiz question.
class DailyQuizOption extends Equatable {
  final String label;
  final bool isCorrect;

  const DailyQuizOption({
    required this.label,
    this.isCorrect = false,
  });

  @override
  List<Object?> get props => [label, isCorrect];
}

/// Result returned after submitting a daily quiz.
class DailyQuizResult extends Equatable {
  final int score;
  final int totalQuestions;
  final int pointsAwarded;

  const DailyQuizResult({
    required this.score,
    required this.totalQuestions,
    required this.pointsAwarded,
  });

  @override
  List<Object?> get props => [score, totalQuestions, pointsAwarded];
}
