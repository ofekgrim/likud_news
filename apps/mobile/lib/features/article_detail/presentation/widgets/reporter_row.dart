import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/author.dart';

/// Reporter profile row displayed below the article title / header.
///
/// Shows the author avatar, name, role, publish time, reading time estimate,
/// and action buttons for sharing, bookmarking, and font-size adjustments.
/// Designed for RTL Hebrew layout.
class ReporterRow extends StatelessWidget {
  /// Structured author entity (may be null for legacy articles).
  final Author? author;

  /// Article publish date for relative time display.
  final DateTime? publishedAt;

  /// Estimated reading time in minutes.
  final int? readingTimeMinutes;

  /// Callback when the share button is tapped.
  final VoidCallback? onShare;

  /// Callback when the bookmark button is tapped.
  final VoidCallback? onBookmark;

  /// Callback when the font-size button is tapped.
  final VoidCallback? onFontSize;

  /// Whether the article is currently bookmarked.
  final bool isFavorite;

  const ReporterRow({
    super.key,
    this.author,
    this.publishedAt,
    this.readingTimeMinutes,
    this.onShare,
    this.onBookmark,
    this.onFontSize,
    this.isFavorite = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                // Author avatar
                _buildAvatar(),
                const SizedBox(width: 10),

                // Author info + meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Name
                      Text(
                        author?.nameHe ?? 'reporter'.tr(),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),

                      // Role
                      if (author?.roleHe != null &&
                          author!.roleHe!.isNotEmpty)
                        Text(
                          author!.roleHe!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),

                      // Publish time + reading time
                      const SizedBox(height: 2),
                      _buildMetaRow(theme),
                    ],
                  ),
                ),

                // Action buttons
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Share
                    _ActionIcon(
                      icon: Icons.share_outlined,
                      tooltip: 'share'.tr(),
                      onPressed: onShare,
                    ),

                    // Bookmark
                    _ActionIcon(
                      icon: isFavorite
                          ? Icons.bookmark
                          : Icons.bookmark_border,
                      tooltip: isFavorite
                          ? 'remove_favorite'.tr()
                          : 'save_article'.tr(),
                      color: isFavorite
                          ? AppColors.likudBlue
                          : AppColors.textSecondary,
                      onPressed: onBookmark,
                    ),

                    // Font size
                    _ActionIcon(
                      icon: Icons.format_size,
                      tooltip: 'font_size'.tr(),
                      onPressed: onFontSize,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Divider
          const Divider(height: 1, color: AppColors.border),
        ],
      ),
    );
  }

  /// Builds the circular author avatar.
  Widget _buildAvatar() {
    final hasAvatar = author?.avatarThumbnailUrl != null &&
        author!.avatarThumbnailUrl!.isNotEmpty;

    if (hasAvatar) {
      return ClipOval(
        child: AppCachedImage(
          imageUrl: author!.avatarThumbnailUrl!,
          width: 40,
          height: 40,
          fit: BoxFit.cover,
        ),
      );
    }

    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.surfaceMedium,
      child: Icon(
        Icons.person,
        size: 22,
        color: AppColors.textTertiary,
      ),
    );
  }

  /// Builds the secondary meta row with relative time and reading estimate.
  Widget _buildMetaRow(ThemeData theme) {
    final parts = <String>[];

    if (publishedAt != null) {
      parts.add(_formatRelativeTime(publishedAt!));
    }

    if (readingTimeMinutes != null && readingTimeMinutes! > 0) {
      parts.add('$readingTimeMinutes דקות קריאה');
    }

    if (parts.isEmpty) return const SizedBox.shrink();

    return Text(
      parts.join(' · '),
      style: theme.textTheme.bodySmall?.copyWith(
        color: AppColors.textTertiary,
        fontSize: 12,
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }

  /// Formats a [DateTime] as a relative Hebrew time string.
  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'עכשיו';
    if (diff.inMinutes < 60) return 'לפני ${diff.inMinutes} דק\'';
    if (diff.inHours < 24) return 'לפני ${diff.inHours} שע\'';
    if (diff.inDays < 7) return 'לפני ${diff.inDays} ימים';

    final d = dateTime.day.toString().padLeft(2, '0');
    final m = dateTime.month.toString().padLeft(2, '0');
    final y = dateTime.year;
    return '$d/$m/$y';
  }
}

/// Small icon button for the reporter row action area.
class _ActionIcon extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final Color? color;
  final VoidCallback? onPressed;

  const _ActionIcon({
    required this.icon,
    required this.tooltip,
    this.color,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      height: 36,
      child: IconButton(
        padding: EdgeInsets.zero,
        iconSize: 20,
        icon: Icon(icon, color: color ?? AppColors.textSecondary),
        tooltip: tooltip,
        onPressed: onPressed,
      ),
    );
  }
}
