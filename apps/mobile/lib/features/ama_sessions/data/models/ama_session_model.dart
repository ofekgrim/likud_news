import '../../domain/entities/ama_session.dart';

/// Data model for AMA sessions. Handles JSON serialization.
///
/// Maps API responses to the domain [AmaSession] entity via [toEntity].
class AmaSessionModel {
  final String id;
  final String candidateId;
  final String candidateName;
  final String title;
  final String? description;
  final DateTime scheduledAt;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final String status;
  final int questionCount;

  const AmaSessionModel({
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

  factory AmaSessionModel.fromJson(Map<String, dynamic> json) {
    return AmaSessionModel(
      id: json['id'] as String,
      candidateId: json['candidateId'] as String,
      candidateName: json['candidateName'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'] as String)
          : null,
      endedAt: json['endedAt'] != null
          ? DateTime.tryParse(json['endedAt'] as String)
          : null,
      status: json['status'] as String? ?? 'draft',
      questionCount: json['questionCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'candidateId': candidateId,
      'candidateName': candidateName,
      'title': title,
      'description': description,
      'scheduledAt': scheduledAt.toIso8601String(),
      'startedAt': startedAt?.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'status': status,
      'questionCount': questionCount,
    };
  }

  AmaSession toEntity() {
    return AmaSession(
      id: id,
      candidateId: candidateId,
      candidateName: candidateName,
      title: title,
      description: description,
      scheduledAt: scheduledAt,
      startedAt: startedAt,
      endedAt: endedAt,
      status: status,
      questionCount: questionCount,
    );
  }
}
