import 'package:equatable/equatable.dart';

/// Immutable ticker item entity for the breaking-news marquee bar.
class TickerItem extends Equatable {
  final int id;
  final String text;
  final String? linkUrl;
  final int? articleId;
  final int position;
  final bool isActive;

  const TickerItem({
    required this.id,
    required this.text,
    this.linkUrl,
    this.articleId,
    this.position = 0,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [
        id,
        text,
        linkUrl,
        articleId,
        position,
        isActive,
      ];
}
