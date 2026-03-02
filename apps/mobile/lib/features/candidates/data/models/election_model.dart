import '../../domain/entities/election.dart';

/// Data model for elections, handles JSON serialization.
///
/// Maps API responses to the domain [Election] entity via [toEntity].
class ElectionModel {
  final String id;
  final String title;
  final String? subtitle;
  final String? description;
  final DateTime? electionDate;
  final DateTime? registrationDeadline;
  final String status;
  final String? coverImageUrl;
  final bool isActive;
  final DateTime? createdAt;

  const ElectionModel({
    required this.id,
    required this.title,
    this.subtitle,
    this.description,
    this.electionDate,
    this.registrationDeadline,
    this.status = 'draft',
    this.coverImageUrl,
    this.isActive = true,
    this.createdAt,
  });

  factory ElectionModel.fromJson(Map<String, dynamic> json) {
    return ElectionModel(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      description: json['description'] as String?,
      electionDate: json['electionDate'] != null
          ? DateTime.tryParse(json['electionDate'] as String)
          : null,
      registrationDeadline: json['registrationDeadline'] != null
          ? DateTime.tryParse(json['registrationDeadline'] as String)
          : null,
      status: json['status'] as String? ?? 'draft',
      coverImageUrl: json['coverImageUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'description': description,
      'electionDate': electionDate?.toIso8601String(),
      'registrationDeadline': registrationDeadline?.toIso8601String(),
      'status': status,
      'coverImageUrl': coverImageUrl,
      'isActive': isActive,
    };
  }

  Election toEntity() {
    return Election(
      id: id,
      title: title,
      subtitle: subtitle,
      description: description,
      electionDate: electionDate,
      registrationDeadline: registrationDeadline,
      status: status,
      coverImageUrl: coverImageUrl,
      isActive: isActive,
      createdAt: createdAt,
    );
  }
}
