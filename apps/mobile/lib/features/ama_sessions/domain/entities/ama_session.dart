import 'package:equatable/equatable.dart';

/// Immutable AMA session entity.
///
/// Represents a Q&A session between a candidate and the community.
class AmaSession extends Equatable {
  final String id;
  final String candidateId;
  final String candidateName;
  final String title;
  final String? description;
  final DateTime scheduledAt;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final String status; // 'draft' | 'scheduled' | 'live' | 'ended' | 'archived'
  final int questionCount;

  const AmaSession({
    required this.id,
    required this.candidateId,
    required this.candidateName,
    required this.title,
    this.description,
    required this.scheduledAt,
    this.startedAt,
    this.endedAt,
    required this.status,
    this.questionCount = 0,
  });

  /// Whether the session is currently live.
  bool get isLive => status == 'live';

  /// Whether the session has ended.
  bool get isEnded => status == 'ended' || status == 'archived';

  /// Whether the session is scheduled (not yet started).
  bool get isScheduled => status == 'scheduled';

  @override
  List<Object?> get props => [
        id,
        candidateId,
        candidateName,
        title,
        description,
        scheduledAt,
        startedAt,
        endedAt,
        status,
        questionCount,
      ];
}
