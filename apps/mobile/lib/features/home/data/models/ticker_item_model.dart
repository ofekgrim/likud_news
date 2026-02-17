import '../../domain/entities/ticker_item.dart';

/// Data model for ticker items, handles JSON serialization.
///
/// Maps API responses to the domain [TickerItem] entity via [toEntity].
class TickerItemModel {
  final String id;
  final String text;
  final String? linkUrl;
  final String? articleId;
  final int position;
  final bool isActive;

  const TickerItemModel({
    required this.id,
    required this.text,
    this.linkUrl,
    this.articleId,
    this.position = 0,
    this.isActive = true,
  });

  factory TickerItemModel.fromJson(Map<String, dynamic> json) {
    return TickerItemModel(
      id: json['id'] as String,
      text: json['text'] as String,
      linkUrl: json['linkUrl'] as String?,
      articleId: json['articleId'] as String?,
      position: json['position'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'linkUrl': linkUrl,
      'articleId': articleId,
      'position': position,
      'isActive': isActive,
    };
  }

  TickerItem toEntity() {
    return TickerItem(
      id: id,
      text: text,
      linkUrl: linkUrl,
      articleId: articleId,
      position: position,
      isActive: isActive,
    );
  }
}
