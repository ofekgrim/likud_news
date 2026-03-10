import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/candidate.dart';

/// Card widget displaying a candidate in the candidates list.
///
/// Horizontal layout with photo, name, district, position,
/// and endorsement count badge.
class CandidateCard extends StatelessWidget {
  final Candidate candidate;
  final VoidCallback? onTap;

  const CandidateCard({
    super.key,
    required this.candidate,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: context.colors.cardSurface,
      borderRadius: BorderRadius.circular(12),
      elevation: 0,
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: context.colors.shadow,
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
                  child: candidate.photoUrl != null &&
                          candidate.photoUrl!.isNotEmpty
                      ? AppCachedImage(
                          imageUrl: candidate.photoUrl!,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          width: 60,
                          height: 60,
                          color: context.colors.surfaceMedium,
                          child: Icon(
                            Icons.person,
                            color: context.colors.textTertiary,
                            size: 30,
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
                        candidate.fullName,
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
                      // District.
                      if (candidate.district != null &&
                          candidate.district!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          candidate.district!,
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
                      // Position.
                      if (candidate.position != null &&
                          candidate.position!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          candidate.position!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textDirection: TextDirection.rtl,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 12,
                            color: context.colors.textTertiary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Endorsement count badge.
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.likudLightBlue,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.thumb_up_outlined,
                        size: 14,
                        color: AppColors.likudBlue,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${candidate.endorsementCount}',
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.likudBlue,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
