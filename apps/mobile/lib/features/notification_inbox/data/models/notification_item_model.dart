import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/notification_item.dart';

part 'notification_item_model.g.dart';

@JsonSerializable()
class NotificationItemModel {
  final String id;
  final String title;
  final String body;
  final String? imageUrl;
  final String contentType;
  final String? contentId;
  final String? contentSlug;
  final String status;
  final String? sentAt;
  final String? openedAt;
  final String createdAt;

  const NotificationItemModel({
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

  factory NotificationItemModel.fromJson(Map<String, dynamic> json) =>
      _$NotificationItemModelFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationItemModelToJson(this);

  NotificationItem toEntity() => NotificationItem(
        id: id,
        title: title,
        body: body,
        imageUrl: imageUrl,
        contentType: contentType,
        contentId: contentId,
        contentSlug: contentSlug,
        status: status,
        sentAt: sentAt != null ? DateTime.parse(sentAt!) : null,
        openedAt: openedAt != null ? DateTime.parse(openedAt!) : null,
        createdAt: DateTime.parse(createdAt),
      );
}
