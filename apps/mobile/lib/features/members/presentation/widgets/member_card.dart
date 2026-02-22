import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/member.dart';

/// Business card style widget for displaying a member in the directory.
///
/// Horizontal layout with circular photo on the start side, member info
/// on the end, and optional social media icon buttons at the bottom.
class MemberCard extends StatelessWidget {
  final Member member;
  final VoidCallback? onTap;

  const MemberCard({
    super.key,
    required this.member,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(12),
      elevation: 0,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
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
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top row: photo + info.
                Row(
                  textDirection: TextDirection.rtl,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Circular photo.
                    ClipOval(
                      child: member.photoUrl != null &&
                              member.photoUrl!.isNotEmpty
                          ? AppCachedImage(
                              imageUrl: member.photoUrl!,
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
                          // Name.
                          Text(
                            member.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textDirection: TextDirection.rtl,
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          // Title.
                          if (member.title != null &&
                              member.title!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              member.title!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textDirection: TextDirection.rtl,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                          // Office.
                          if (member.office != null &&
                              member.office!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              member.office!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textDirection: TextDirection.rtl,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 12,
                                color: AppColors.textTertiary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                // Bottom row: social media icons (only if links exist).
                if (_hasSocialLinks()) ...[
                  const SizedBox(height: 10),
                  Row(
                    textDirection: TextDirection.rtl,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      // Add left padding to align with info column
                      // (56px photo + 14px spacing = 70px).
                      const SizedBox(width: 70),
                      if (member.socialFacebook != null &&
                          member.socialFacebook!.isNotEmpty)
                        _SocialIconButton(
                          icon: Icons.facebook,
                          color: const Color(0xFF1877F2),
                        ),
                      if (member.socialTwitter != null &&
                          member.socialTwitter!.isNotEmpty)
                        _SocialIconButton(
                          icon: Icons.alternate_email,
                          color: const Color(0xFF1DA1F2),
                        ),
                      if (member.socialInstagram != null &&
                          member.socialInstagram!.isNotEmpty)
                        _SocialIconButton(
                          icon: Icons.camera_alt_outlined,
                          color: const Color(0xFFE4405F),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool _hasSocialLinks() {
    return (member.socialFacebook != null &&
            member.socialFacebook!.isNotEmpty) ||
        (member.socialTwitter != null && member.socialTwitter!.isNotEmpty) ||
        (member.socialInstagram != null && member.socialInstagram!.isNotEmpty);
  }
}

/// Small social media icon button for the card.
class _SocialIconButton extends StatelessWidget {
  final IconData icon;
  final Color color;

  const _SocialIconButton({
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Icon(
        icon,
        color: color,
        size: 20,
      ),
    );
  }
}
