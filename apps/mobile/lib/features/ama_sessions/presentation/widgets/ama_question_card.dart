import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/ama_question.dart';

/// A card widget displaying a single AMA question.
///
/// Shows the question text, author name, upvote button with count,
/// and an answer section if the question has been answered.
/// Pinned questions are highlighted with a pin icon.
class AmaQuestionCard extends StatelessWidget {
  final AmaQuestion question;
  final VoidCallback onUpvote;

  const AmaQuestionCard({
    super.key,
    required this.question,
    required this.onUpvote,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: question.isPinned
            ? AppColors.likudBlue.withValues(alpha: 0.04)
            : context.colors.cardSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: question.isPinned
              ? AppColors.likudBlue.withValues(alpha: 0.3)
              : context.colors.border,
        ),
      ),
      child: Padding(
        padding: const EdgeInsetsDirectional.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: author name + pinned badge
            _buildHeader(context),

            const SizedBox(height: 10),

            // Question text
            Text(
              question.questionText,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: context.colors.textPrimary,
                height: 1.5,
              ),
            ),

            // Answer section
            if (question.isAnswered) ...[
              const SizedBox(height: 12),
              _buildAnswer(context),
            ],

            const SizedBox(height: 12),

            // Footer: upvote button + status
            _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        // Author avatar placeholder
        CircleAvatar(
          radius: 14,
          backgroundColor: AppColors.likudBlue.withValues(alpha: 0.15),
          child: Text(
            question.authorName.isNotEmpty
                ? question.authorName[0].toUpperCase()
                : '?',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.likudBlue,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            question.authorName,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        if (question.isPinned) ...[
          Icon(
            Icons.push_pin,
            size: 16,
            color: AppColors.likudBlue,
          ),
          const SizedBox(width: 4),
          Text(
            'ama.pinned'.tr(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.likudBlue,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildAnswer(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: BorderDirectional(
          start: BorderSide(
            color: AppColors.likudBlue,
            width: 3,
          ),
        ),
      ),
      padding: const EdgeInsetsDirectional.fromSTEB(12, 10, 12, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle,
                size: 14,
                color: AppColors.success,
              ),
              const SizedBox(width: 4),
              Text(
                'ama.answered'.tr(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            question.answerText!,
            style: TextStyle(
              fontSize: 14,
              color: context.colors.textPrimary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Row(
      children: [
        // Upvote button
        InkWell(
          onTap: question.hasUpvoted ? null : onUpvote,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsetsDirectional.fromSTEB(10, 6, 10, 6),
            decoration: BoxDecoration(
              color: question.hasUpvoted
                  ? AppColors.likudBlue.withValues(alpha: 0.1)
                  : context.colors.surfaceVariant,
              borderRadius: BorderRadius.circular(20),
              border: question.hasUpvoted
                  ? Border.all(
                      color: AppColors.likudBlue.withValues(alpha: 0.3))
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  question.hasUpvoted
                      ? Icons.thumb_up
                      : Icons.thumb_up_outlined,
                  size: 16,
                  color: question.hasUpvoted
                      ? AppColors.likudBlue
                      : context.colors.textSecondary,
                ),
                const SizedBox(width: 6),
                Text(
                  '${question.upvoteCount}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: question.hasUpvoted
                        ? AppColors.likudBlue
                        : context.colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 8),

        // Status badge for pending questions
        if (question.status == 'pending')
          Container(
            padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 8, 4),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'ama.pending'.tr(),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.warning,
              ),
            ),
          ),
      ],
    );
  }
}
