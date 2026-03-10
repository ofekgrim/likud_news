import '../../domain/entities/daily_quiz.dart';

/// Data model for daily quiz, handles JSON serialization.
///
/// Maps API responses to the domain [DailyQuiz] entity via [toEntity].
class DailyQuizModel {
  final String id;
  final DateTime date;
  final List<DailyQuizQuestionModel> questions;
  final bool isActive;
  final int pointsReward;
  final bool userHasCompleted;
  final int? userScore;

  const DailyQuizModel({
    required this.id,
    required this.date,
    required this.questions,
    required this.isActive,
    required this.pointsReward,
    required this.userHasCompleted,
    this.userScore,
  });

  factory DailyQuizModel.fromJson(Map<String, dynamic> json) {
    return DailyQuizModel(
      id: json['id'] as String,
      date: DateTime.parse(json['date'] as String),
      questions: (json['questions'] as List<dynamic>)
          .map((q) =>
              DailyQuizQuestionModel.fromJson(q as Map<String, dynamic>))
          .toList(),
      isActive: json['isActive'] as bool? ?? true,
      pointsReward: json['pointsReward'] as int? ?? 0,
      userHasCompleted: json['userHasCompleted'] as bool? ?? false,
      userScore: json['userScore'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'questions': questions.map((q) => q.toJson()).toList(),
      'isActive': isActive,
      'pointsReward': pointsReward,
      'userHasCompleted': userHasCompleted,
      'userScore': userScore,
    };
  }

  DailyQuiz toEntity() {
    return DailyQuiz(
      id: id,
      date: date,
      questions: questions.map((q) => q.toEntity()).toList(),
      isActive: isActive,
      pointsReward: pointsReward,
      userHasCompleted: userHasCompleted,
      userScore: userScore,
    );
  }
}

/// Data model for a single daily quiz question.
class DailyQuizQuestionModel {
  final String questionText;
  final List<DailyQuizOptionModel> options;
  final String? linkedArticleId;
  final String? linkedArticleSlug;

  const DailyQuizQuestionModel({
    required this.questionText,
    required this.options,
    this.linkedArticleId,
    this.linkedArticleSlug,
  });

  factory DailyQuizQuestionModel.fromJson(Map<String, dynamic> json) {
    return DailyQuizQuestionModel(
      questionText: json['questionText'] as String,
      options: (json['options'] as List<dynamic>)
          .map((o) =>
              DailyQuizOptionModel.fromJson(o as Map<String, dynamic>))
          .toList(),
      linkedArticleId: json['linkedArticleId'] as String?,
      linkedArticleSlug: json['linkedArticleSlug'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'questionText': questionText,
      'options': options.map((o) => o.toJson()).toList(),
      'linkedArticleId': linkedArticleId,
      'linkedArticleSlug': linkedArticleSlug,
    };
  }

  DailyQuizQuestion toEntity() {
    return DailyQuizQuestion(
      questionText: questionText,
      options: options.map((o) => o.toEntity()).toList(),
      linkedArticleId: linkedArticleId,
      linkedArticleSlug: linkedArticleSlug,
    );
  }
}

/// Data model for a single daily quiz option.
class DailyQuizOptionModel {
  final String label;
  final bool isCorrect;

  const DailyQuizOptionModel({
    required this.label,
    this.isCorrect = false,
  });

  factory DailyQuizOptionModel.fromJson(Map<String, dynamic> json) {
    return DailyQuizOptionModel(
      label: json['label'] as String,
      isCorrect: json['isCorrect'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'isCorrect': isCorrect,
    };
  }

  DailyQuizOption toEntity() {
    return DailyQuizOption(
      label: label,
      isCorrect: isCorrect,
    );
  }
}

/// Data model for the quiz submission result.
class DailyQuizResultModel {
  final int score;
  final int totalQuestions;
  final int pointsAwarded;

  const DailyQuizResultModel({
    required this.score,
    required this.totalQuestions,
    required this.pointsAwarded,
  });

  factory DailyQuizResultModel.fromJson(Map<String, dynamic> json) {
    return DailyQuizResultModel(
      score: json['score'] as int,
      totalQuestions: json['totalQuestions'] as int,
      pointsAwarded: json['pointsAwarded'] as int? ?? 0,
    );
  }

  DailyQuizResult toEntity() {
    return DailyQuizResult(
      score: score,
      totalQuestions: totalQuestions,
      pointsAwarded: pointsAwarded,
    );
  }
}
