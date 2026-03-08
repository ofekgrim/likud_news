import 'package:equatable/equatable.dart';

class NotificationItem extends Equatable {
  final String id;
  final String title;
  final String body;
  final String? imageUrl;
  final String contentType;
  final String? contentId;
  final String? contentSlug;
  final String status;
  final DateTime? sentAt;
  final DateTime? openedAt;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrl,
    required this.contentType,
    this.contentId,
    this.contentSlug,
    required this.status,
    this.sentAt,
    this.openedAt,
    required this.createdAt,
  });

  bool get isRead => openedAt != null;

  @override
  List<Object?> get props => [id, title, body, contentType, status, openedAt];
}
