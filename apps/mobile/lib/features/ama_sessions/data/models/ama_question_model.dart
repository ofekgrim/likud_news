import '../../domain/entities/ama_question.dart';

/// Data model for AMA questions. Handles JSON serialization.
///
/// Maps API responses to the domain [AmaQuestion] entity via [toEntity].
class AmaQuestionModel {
  final String id;
  final String sessionId;
  final String? appUserId;
  final String authorName;
  final String questionText;
  final String? answerText;
  final DateTime? answeredAt;
  final int upvoteCount;
  final String status;
  final bool isPinned;
  final bool hasUpvoted;

  const AmaQuestionModel({
    required this.id,
    required this.sessionId,
    this.appUserId,
    required this.authorName,
    required this.questionText,
    this.answerText,
    this.answeredAt,
    this.upvoteCount = 0,
    required this.status,
    this.isPinned = false,
    this.hasUpvoted = false,
  });

  factory AmaQuestionModel.fromJson(Map<String, dynamic> json) {
    return AmaQuestionModel(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String,
      appUserId: json['appUserId'] as String?,
      authorName: json['authorName'] as String? ?? '',
      questionText: json['questionText'] as String,
      answerText: json['answerText'] as String?,
      answeredAt: json['answeredAt'] != null
          ? DateTime.tryParse(json['answeredAt'] as String)
          : null,
      upvoteCount: json['upvoteCount'] as int? ?? 0,
      status: json['status'] as String? ?? 'pending',
      isPinned: json['isPinned'] as bool? ?? false,
      hasUpvoted: json['hasUpvoted'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sessionId': sessionId,
      'appUserId': appUserId,
      'authorName': authorName,
      'questionText': questionText,
      'answerText': answerText,
      'answeredAt': answeredAt?.toIso8601String(),
      'upvoteCount': upvoteCount,
      'status': status,
      'isPinned': isPinned,
      'hasUpvoted': hasUpvoted,
    };
  }

  AmaQuestion toEntity() {
    return AmaQuestion(
      id: id,
      sessionId: sessionId,
      appUserId: appUserId,
      authorName: authorName,
      questionText: questionText,
      answerText: answerText,
      answeredAt: answeredAt,
      upvoteCount: upvoteCount,
      status: status,
      isPinned: isPinned,
      hasUpvoted: hasUpvoted,
    );
  }
}
