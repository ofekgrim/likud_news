import '../../domain/entities/quiz_question.dart';

/// Data model for quiz questions, handles JSON serialization.
///
/// Maps API responses to the domain [QuizQuestion] entity via [toEntity].
class QuizOptionModel {
  final String label;
  final double value;

  const QuizOptionModel({
    required this.label,
    required this.value,
  });

  factory QuizOptionModel.fromJson(Map<String, dynamic> json) {
    return QuizOptionModel(
      label: json['label'] as String,
      value: double.tryParse(json['value'].toString()) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'value': value,
    };
  }

  QuizOption toEntity() {
    return QuizOption(
      label: label,
      value: value,
    );
  }
}

/// Data model for quiz questions, handles JSON serialization.
class QuizQuestionModel {
  final String id;
  final String electionId;
  final String questionText;
  final List<QuizOptionModel> options;
  final String importance;
  final String? category;
  final int sortOrder;

  const QuizQuestionModel({
    required this.id,
    required this.electionId,
    required this.questionText,
    required this.options,
    required this.importance,
    this.category,
    required this.sortOrder,
  });

  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    final optionsList = json['options'] as List<dynamic>;
    return QuizQuestionModel(
      id: json['id'] as String,
      electionId: json['electionId'] as String,
      questionText: json['questionText'] as String,
      options: optionsList
          .map((o) => QuizOptionModel.fromJson(o as Map<String, dynamic>))
          .toList(),
      importance: json['importance'] as String? ?? 'medium',
      category: json['category'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'electionId': electionId,
      'questionText': questionText,
      'options': options.map((o) => o.toJson()).toList(),
      'importance': importance,
      'category': category,
      'sortOrder': sortOrder,
    };
  }

  QuizQuestion toEntity() {
    return QuizQuestion(
      id: id,
      electionId: electionId,
      questionText: questionText,
      options: options.map((o) => o.toEntity()).toList(),
      importance: importance,
      category: category,
      sortOrder: sortOrder,
    );
  }
}
