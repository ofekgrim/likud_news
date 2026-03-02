import 'package:equatable/equatable.dart';

/// Immutable election entity used throughout the domain and presentation layers.
class Election extends Equatable {
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

  const Election({
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

  @override
  List<Object?> get props => [
        id,
        title,
        subtitle,
        description,
        electionDate,
        registrationDeadline,
        status,
        coverImageUrl,
        isActive,
        createdAt,
      ];
}
