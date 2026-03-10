import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../domain/entities/feed_item.dart';

/// Card widget for displaying the daily quiz in the feed
class FeedDailyQuizCard extends StatelessWidget {
  final FeedDailyQuizContent dailyQuiz;
  final bool isPinned;
  final VoidCallback? onTap;

  const FeedDailyQuizCard({
    super.key,
    required this.dailyQuiz,
    this.isPinned = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final completed = dailyQuiz.userHasCompleted;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: completed ? AppColors.success : AppColors.likudBlue,
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
              colors: completed
                  ? [
                      AppColors.success.withValues(alpha: 0.08),
                      AppColors.success.withValues(alpha: 0.02),
                    ]
                  : [
                      AppColors.likudBlue.withValues(alpha: 0.12),
                      AppColors.likudDarkBlue.withValues(alpha: 0.04),
                    ],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: completed
                            ? AppColors.success
                            : AppColors.likudBlue,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            completed
                                ? Icons.check_circle
                                : Icons.local_fire_department,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'daily_quiz_title'.tr(),
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
                    // Points reward badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.star,
                            color: Colors.amber,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${dailyQuiz.pointsReward} ${'points'.tr()}',
                            style: const TextStyle(
                              color: Colors.amber,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Main content
                Row(
                  children: [
                    // Quiz icon
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: (completed
                                ? AppColors.success
                                : AppColors.likudBlue)
                            .withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        completed ? Icons.emoji_events : Icons.quiz,
                        size: 32,
                        color: completed
                            ? AppColors.success
                            : AppColors.likudBlue,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            completed
                                ? 'daily_quiz_completed'.tr()
                                : 'daily_quiz_description'.tr(),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              height: 1.3,
                              color: context.colors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${dailyQuiz.questionsCount} ${'questions'.tr()}',
                            style: TextStyle(
                              fontSize: 13,
                              color: context.colors.textTertiary,
                            ),
                          ),
                          if (completed && dailyQuiz.userScore != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              '${'score'.tr()}: ${dailyQuiz.userScore}/${dailyQuiz.questionsCount}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.success,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                if (!completed) ...[
                  const SizedBox(height: 16),

                  // CTA button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        if (!requireAuth(context)) return;
                        onTap?.call();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.likudBlue,
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
                          const Icon(Icons.play_arrow, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'daily_quiz_start'.tr(),
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
