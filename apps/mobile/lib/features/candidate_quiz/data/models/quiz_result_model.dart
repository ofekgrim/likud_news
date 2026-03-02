import '../../domain/entities/quiz_result.dart';
import 'quiz_answer_model.dart';

/// Data model for candidate match results from the quiz API.
class CandidateMatchModel {
  final String candidateId;
  final String candidateName;
  final int matchPercentage;

  const CandidateMatchModel({
    required this.candidateId,
    required this.candidateName,
    required this.matchPercentage,
  });

  factory CandidateMatchModel.fromJson(Map<String, dynamic> json) {
    return CandidateMatchModel(
      candidateId: json['candidateId'] as String,
      candidateName: (json['candidateName'] as String?) ?? '',
      matchPercentage: int.tryParse(json['matchPercentage'].toString()) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'candidateId': candidateId,
      'candidateName': candidateName,
      'matchPercentage': matchPercentage,
    };
  }

  CandidateMatch toEntity() {
    return CandidateMatch(
      candidateId: candidateId,
      candidateName: candidateName,
      matchPercentage: matchPercentage,
    );
  }
}

/// Data model for the full quiz result, including answers and match results.
class QuizResultModel {
  final String id;
  final String electionId;
  final List<QuizAnswerModel> answers;
  final List<CandidateMatchModel> matchResults;
  final DateTime? completedAt;

  const QuizResultModel({
    required this.id,
    required this.electionId,
    required this.answers,
    required this.matchResults,
    this.completedAt,
  });

  factory QuizResultModel.fromJson(Map<String, dynamic> json) {
    final answersList = json['answers'] as List<dynamic>? ?? [];
    final matchResultsList = json['matchResults'] as List<dynamic>? ?? [];

    return QuizResultModel(
      id: json['id'] as String,
      electionId: json['electionId'] as String,
      answers: answersList
          .whereType<Map<String, dynamic>>()
          .map((a) => QuizAnswerModel.fromJson(a))
          .toList(),
      matchResults: matchResultsList
          .whereType<Map<String, dynamic>>()
          .map((m) => CandidateMatchModel.fromJson(m))
          .toList(),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'electionId': electionId,
      'answers': answers.map((a) => a.toJson()).toList(),
      'matchResults': matchResults.map((m) => m.toJson()).toList(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  QuizResult toEntity() {
    return QuizResult(
      id: id,
      electionId: electionId,
      answers: answers.map((a) => a.toEntity()).toList(),
      matchResults: matchResults.map((m) => m.toEntity()).toList(),
      completedAt: completedAt,
    );
  }
}
