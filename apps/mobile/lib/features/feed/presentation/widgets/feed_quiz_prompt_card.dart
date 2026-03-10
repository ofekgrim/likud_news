import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../domain/entities/feed_item.dart';

/// Card widget for displaying a quiz prompt in the feed
class FeedQuizPromptCard extends StatelessWidget {
  final FeedQuizContent quizPrompt;
  final bool isPinned;
  final VoidCallback? onTap;

  const FeedQuizPromptCard({
    super.key,
    required this.quizPrompt,
    this.isPinned = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isPinned ? AppColors.likudBlue : Colors.transparent,
          width: isPinned ? 2 : 0,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.likudBlue.withValues(alpha: 0.1),
                AppColors.likudDarkBlue.withValues(alpha: 0.05),
              ],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.likudBlue,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.quiz_outlined,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'candidate_quiz'.tr(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    if (isPinned)
                      Icon(
                        Icons.push_pin,
                        color: AppColors.likudBlue,
                        size: 18,
                      ),
                  ],
                ),

                const SizedBox(height: 20),

                // Main content
                Row(
                  children: [
                    // Quiz illustration/icon
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.likudBlue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: quizPrompt.imageUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                quizPrompt.imageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    Icon(
                                  Icons.quiz,
                                  size: 40,
                                  color: AppColors.likudBlue,
                                ),
                              ),
                            )
                          : Icon(
                              Icons.quiz,
                              size: 40,
                              color: AppColors.likudBlue,
                            ),
                    ),

                    const SizedBox(width: 16),

                    // Text content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          Text(
                            quizPrompt.title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              height: 1.3,
                              color: context.colors.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),

                          // Description
                          if (quizPrompt.description != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              quizPrompt.description!,
                              style: TextStyle(
                                fontSize: 13,
                                color: context.colors.textSecondary,
                                height: 1.4,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Quiz stats
                Row(
                  children: [
                    // Questions count
                    _StatBadge(
                      icon: Icons.help_outline,
                      text: '${quizPrompt.questionsCount} ${'questions'.tr()}',
                    ),

                    const SizedBox(width: 12),

                    // Completion rate
                    if (quizPrompt.completionRate != null)
                      _StatBadge(
                        icon: Icons.people_outline,
                        text: '${quizPrompt.completionRate!.toStringAsFixed(0)}% ${'completed'.tr()}',
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // User match badge (if completed)
                if (quizPrompt.userHasCompleted &&
                    quizPrompt.userMatchPercentage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.success,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle,
                          color: AppColors.success,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${'your_match'.tr()}: ${quizPrompt.userMatchPercentage!.toStringAsFixed(0)}%',
                          style: TextStyle(
                            color: AppColors.success,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // CTA button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      if (!requireAuth(context)) return;
                      onTap?.call();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: quizPrompt.userHasCompleted
                          ? AppColors.likudDarkBlue
                          : AppColors.likudBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          quizPrompt.userHasCompleted
                              ? Icons.replay
                              : Icons.play_arrow,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          quizPrompt.userHasCompleted
                              ? 'retake_quiz'.tr()
                              : 'start_quiz'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
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

/// Widget for displaying quiz stats (questions count, completion rate)
class _StatBadge extends StatelessWidget {
  final IconData icon;
  final String text;

  const _StatBadge({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: context.colors.textSecondary),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: context.colors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
