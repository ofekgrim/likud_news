import 'package:equatable/equatable.dart';

/// Immutable AMA question entity.
///
/// Represents a question submitted to an AMA session, optionally
/// with an answer from the candidate.
class AmaQuestion extends Equatable {
  final String id;
  final String sessionId;
  final String? appUserId;
  final String authorName;
  final String questionText;
  final String? answerText;
  final DateTime? answeredAt;
  final int upvoteCount;
  final String status; // 'pending' | 'approved' | 'answered' | 'rejected'
  final bool isPinned;
  final bool hasUpvoted; // client-side tracking

  const AmaQuestion({
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

  /// Whether this question has been answered.
  bool get isAnswered => answerText != null && answerText!.isNotEmpty;

  /// Creates a copy with the upvote applied optimistically.
  AmaQuestion withUpvote() {
    return AmaQuestion(
      id: id,
      sessionId: sessionId,
      appUserId: appUserId,
      authorName: authorName,
      questionText: questionText,
      answerText: answerText,
      answeredAt: answeredAt,
      upvoteCount: upvoteCount + 1,
      status: status,
      isPinned: isPinned,
      hasUpvoted: true,
    );
  }

  @override
  List<Object?> get props => [
        id,
        sessionId,
        appUserId,
        authorName,
        questionText,
        answerText,
        answeredAt,
        upvoteCount,
        status,
        isPinned,
        hasUpvoted,
      ];
}
