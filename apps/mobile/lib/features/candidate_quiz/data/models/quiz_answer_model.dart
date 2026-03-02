import '../../domain/entities/quiz_answer.dart';

/// Data model for quiz answers, handles JSON serialization.
///
/// Used when submitting quiz answers to the API.
class QuizAnswerModel {
  final String questionId;
  final double selectedValue;
  final int importance;

  const QuizAnswerModel({
    required this.questionId,
    required this.selectedValue,
    required this.importance,
  });

  /// Creates a model from a domain [QuizAnswer] entity.
  factory QuizAnswerModel.fromEntity(QuizAnswer entity) {
    return QuizAnswerModel(
      questionId: entity.questionId,
      selectedValue: entity.selectedValue,
      importance: entity.importance,
    );
  }

  factory QuizAnswerModel.fromJson(Map<String, dynamic> json) {
    return QuizAnswerModel(
      questionId: json['questionId'] as String,
      selectedValue: double.tryParse(json['selectedValue'].toString()) ?? 0.0,
      importance: json['importance'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'questionId': questionId,
      'selectedValue': selectedValue,
      'importance': importance,
    };
  }

  QuizAnswer toEntity() {
    return QuizAnswer(
      questionId: questionId,
      selectedValue: selectedValue,
      importance: importance,
    );
  }
}
