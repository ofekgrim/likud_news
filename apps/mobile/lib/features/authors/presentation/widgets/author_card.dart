import 'package:flutter/material.dart';
import 'package:metzudat_halikud/app/theme/theme_context.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../article_detail/domain/entities/author.dart';

/// Business card style widget for displaying an author in the directory.
class AuthorCard extends StatelessWidget {
  final Author author;
  final VoidCallback? onTap;

  const AuthorCard({super.key, required this.author, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: context.colors.surface,
      borderRadius: BorderRadius.circular(12),
      elevation: 0,
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsetsDirectional.all(14),
            child: Row(
              textDirection: TextDirection.rtl,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Circular photo.
                ClipOval(
                  child:
                      author.avatarUrl != null && author.avatarUrl!.isNotEmpty
                      ? AppCachedImage(
                          imageUrl: author.avatarUrl!,
                          width: 56,
                          height: 56,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          width: 56,
                          height: 56,
                          color: AppColors.surfaceMedium,
                          child: const Icon(
                            Icons.person,
                            color: AppColors.textTertiary,
                            size: 28,
                          ),
                        ),
                ),
                const SizedBox(width: 14),
                // Info column.
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        author.nameHe,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: context.colors.textPrimary,
                        ),
                      ),
                      if (author.roleHe != null &&
                          author.roleHe!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          author.roleHe!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textDirection: TextDirection.rtl,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 14,
                            color: context.colors.textSecondary,
                          ),
                        ),
                      ],
                      if (_hasSocialLinks()) ...[
                        const SizedBox(height: 6),
                        Row(
                          textDirection: TextDirection.rtl,
                          children: [
                            if (author.socialLinks.containsKey('facebook'))
                              _SocialIcon(
                                icon: Icons.facebook,
                                color: const Color(0xFF1877F2), // Facebook blue
                              ),
                            if (author.socialLinks.containsKey('twitter'))
                              _SocialIcon(
                                icon: Icons.alternate_email,
                                color: const Color(0xFF1DA1F2),
                              ),
                            if (author.socialLinks.containsKey('instagram'))
                              _SocialIcon(
                                icon: Icons.camera_alt_outlined,
                                color: const Color(0xFFE4405F), // Instagram red
                              ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                // Arrow indicator.
                const Icon(
                  Icons.chevron_left,
                  color: AppColors.textTertiary,
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool _hasSocialLinks() => author.socialLinks.isNotEmpty;
}

class _SocialIcon extends StatelessWidget {
  final IconData icon;
  final Color color;

  const _SocialIcon({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Icon(icon, color: color, size: 18),
    );
  }
}
