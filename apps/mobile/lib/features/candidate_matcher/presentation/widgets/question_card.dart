import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/policy_statement.dart';
import '../../domain/entities/quiz_answer.dart';

/// Displays a single policy statement with agree/disagree/skip buttons.
///
/// Uses the statement's Hebrew text and shows a category badge.
/// Calls [onAnswer] when the user taps one of the three action buttons.
class QuestionCard extends StatelessWidget {
  final PolicyStatement statement;
  final QuizAnswer? currentAnswer;
  final ValueChanged<QuizAnswer> onAnswer;

  const QuestionCard({
    super.key,
    required this.statement,
    this.currentAnswer,
    required this.onAnswer,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsetsDirectional.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsetsDirectional.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Category badge
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Container(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _categoryColor(statement.category)
                      .withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _categoryLabel(statement.category),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _categoryColor(statement.category),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Statement text
            Text(
              statement.textHe,
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.start,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            // Answer buttons
            Row(
              children: [
                Expanded(
                  child: _AnswerButton(
                    label: 'matcher_agree'.tr(),
                    icon: Icons.thumb_up_outlined,
                    selectedIcon: Icons.thumb_up,
                    color: AppColors.success,
                    isSelected: currentAnswer == QuizAnswer.agree,
                    onTap: () => onAnswer(QuizAnswer.agree),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _AnswerButton(
                    label: 'matcher_disagree'.tr(),
                    icon: Icons.thumb_down_outlined,
                    selectedIcon: Icons.thumb_down,
                    color: AppColors.breakingRed,
                    isSelected: currentAnswer == QuizAnswer.disagree,
                    onTap: () => onAnswer(QuizAnswer.disagree),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _AnswerButton(
                    label: 'matcher_skip'.tr(),
                    icon: Icons.skip_next_outlined,
                    selectedIcon: Icons.skip_next,
                    color: AppColors.textTertiary,
                    isSelected: currentAnswer == QuizAnswer.skip,
                    onTap: () => onAnswer(QuizAnswer.skip),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _categoryColor(PolicyCategory category) {
    switch (category) {
      case PolicyCategory.security:
        return const Color(0xFFDC2626);
      case PolicyCategory.economy:
        return const Color(0xFF16A34A);
      case PolicyCategory.judiciary:
        return const Color(0xFF7C3AED);
      case PolicyCategory.housing:
        return const Color(0xFFF59E0B);
      case PolicyCategory.social:
        return AppColors.likudBlue;
      case PolicyCategory.foreign:
        return const Color(0xFFE65100);
    }
  }

  String _categoryLabel(PolicyCategory category) {
    switch (category) {
      case PolicyCategory.security:
        return 'matcher_category_security'.tr();
      case PolicyCategory.economy:
        return 'matcher_category_economy'.tr();
      case PolicyCategory.judiciary:
        return 'matcher_category_judiciary'.tr();
      case PolicyCategory.housing:
        return 'matcher_category_housing'.tr();
      case PolicyCategory.social:
        return 'matcher_category_social'.tr();
      case PolicyCategory.foreign:
        return 'matcher_category_foreign'.tr();
    }
  }
}

/// A single answer button (agree / disagree / skip).
class _AnswerButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _AnswerButton({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? color.withValues(alpha: 0.12) : context.colors.surfaceVariant,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsetsDirectional.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : context.colors.border,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                isSelected ? selectedIcon : icon,
                size: 24,
                color: isSelected ? color : context.colors.textSecondary,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? color : context.colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
