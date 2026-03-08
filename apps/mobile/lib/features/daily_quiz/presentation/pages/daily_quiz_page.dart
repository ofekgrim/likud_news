import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../domain/entities/daily_quiz.dart';
import '../bloc/daily_quiz_bloc.dart';

/// Page for the daily quiz feature.
///
/// Displays a swipeable PageView of questions with option buttons.
/// Shows a score dialog on submission and handles the already-completed state.
class DailyQuizPage extends StatefulWidget {
  const DailyQuizPage({super.key});

  @override
  State<DailyQuizPage> createState() => _DailyQuizPageState();
}

class _DailyQuizPageState extends State<DailyQuizPage> {
  late final PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    context.read<DailyQuizBloc>().add(const LoadDailyQuiz());
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: BlocConsumer<DailyQuizBloc, DailyQuizState>(
        listener: (context, state) {
          if (state is DailyQuizLoaded && state.result != null) {
            _showResultDialog(context, state.result!);
          }
        },
        builder: (context, state) {
          return Scaffold(
            appBar: _buildAppBar(state),
            body: _buildBody(state),
          );
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(DailyQuizState state) {
    String subtitle = '';
    if (state is DailyQuizLoaded) {
      subtitle =
          '${_currentPage + 1}/${state.quiz.questions.length}';
    }

    return AppBar(
      title: Text(
        'daily_quiz_title'.tr(),
        style: const TextStyle(
          fontFamily: 'Heebo',
          fontWeight: FontWeight.w700,
        ),
      ),
      centerTitle: true,
      actions: [
        if (subtitle.isNotEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsetsDirectional.only(end: 16),
              child: Text(
                subtitle,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.likudBlue,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBody(DailyQuizState state) {
    if (state is DailyQuizLoading || state is DailyQuizInitial) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state is DailyQuizNoQuiz) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.quiz_outlined,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              'daily_quiz_no_quiz'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'daily_quiz_come_back'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    if (state is DailyQuizError) {
      return ErrorView(
        message: state.message,
        onRetry: () =>
            context.read<DailyQuizBloc>().add(const LoadDailyQuiz()),
      );
    }

    if (state is DailyQuizLoaded) {
      // Already completed state
      if (state.quiz.userHasCompleted && state.result == null) {
        return _buildCompletedView(state.quiz);
      }

      return Column(
        children: [
          // Progress indicator
          _buildProgressBar(state),

          // Questions PageView
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              itemCount: state.quiz.questions.length,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemBuilder: (context, index) {
                return _buildQuestionPage(
                  context,
                  question: state.quiz.questions[index],
                  questionIndex: index,
                  selectedOption: state.selectedAnswers[index],
                  showResult: state.result != null,
                );
              },
            ),
          ),

          // Submit button
          _buildBottomBar(state),
        ],
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildProgressBar(DailyQuizLoaded state) {
    final progress = state.selectedAnswers.length / state.quiz.questions.length;

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: progress,
          backgroundColor: AppColors.surfaceMedium,
          valueColor:
              const AlwaysStoppedAnimation<Color>(AppColors.likudBlue),
          minHeight: 6,
        ),
      ),
    );
  }

  Widget _buildQuestionPage(
    BuildContext context, {
    required DailyQuizQuestion question,
    required int questionIndex,
    int? selectedOption,
    required bool showResult,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(20, 24, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Question text
          Text(
            question.questionText,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              height: 1.4,
            ),
          ),

          // Linked article hint
          if (question.linkedArticleSlug != null) ...[
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => context.push('/article/${question.linkedArticleSlug}'),
              child: Text(
                'daily_quiz_read_article'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: AppColors.likudBlue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Option buttons
          ...List.generate(
            question.options.length,
            (optionIndex) => _buildOptionButton(
              option: question.options[optionIndex],
              optionIndex: optionIndex,
              questionIndex: questionIndex,
              isSelected: selectedOption == optionIndex,
              showResult: showResult,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionButton({
    required DailyQuizOption option,
    required int optionIndex,
    required int questionIndex,
    required bool isSelected,
    required bool showResult,
  }) {
    Color backgroundColor;
    Color borderColor;
    Color textColor;

    if (showResult) {
      if (option.isCorrect) {
        backgroundColor = AppColors.success.withValues(alpha: 0.1);
        borderColor = AppColors.success;
        textColor = AppColors.success;
      } else if (isSelected && !option.isCorrect) {
        backgroundColor = AppColors.breakingRed.withValues(alpha: 0.1);
        borderColor = AppColors.breakingRed;
        textColor = AppColors.breakingRed;
      } else {
        backgroundColor = AppColors.white;
        borderColor = AppColors.border;
        textColor = AppColors.textSecondary;
      }
    } else if (isSelected) {
      backgroundColor = AppColors.likudBlue.withValues(alpha: 0.1);
      borderColor = AppColors.likudBlue;
      textColor = AppColors.likudBlue;
    } else {
      backgroundColor = AppColors.white;
      borderColor = AppColors.border;
      textColor = AppColors.textPrimary;
    }

    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 12),
      child: InkWell(
        onTap: showResult
            ? null
            : () {
                context.read<DailyQuizBloc>().add(SelectAnswer(
                      questionIndex: questionIndex,
                      optionIndex: optionIndex,
                    ));
              },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 14),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor, width: 1.5),
          ),
          child: Row(
            children: [
              // Option letter
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isSelected || (showResult && option.isCorrect)
                      ? borderColor
                      : AppColors.surfaceMedium,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  String.fromCharCode(0x05D0 + optionIndex), // Hebrew letters
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isSelected || (showResult && option.isCorrect)
                        ? AppColors.white
                        : AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Option text
              Expanded(
                child: Text(
                  option.label,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: textColor,
                  ),
                ),
              ),
              // Result icon
              if (showResult && (option.isCorrect || isSelected))
                Icon(
                  option.isCorrect ? Icons.check_circle : Icons.cancel,
                  color: option.isCorrect
                      ? AppColors.success
                      : AppColors.breakingRed,
                  size: 22,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar(DailyQuizLoaded state) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(20, 8, 20, 16),
        child: Row(
          children: [
            // Navigation dots
            Expanded(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  state.quiz.questions.length,
                  (index) {
                    final isAnswered = state.selectedAnswers.containsKey(index);
                    final isCurrent = index == _currentPage;
                    return Container(
                      width: isCurrent ? 24 : 8,
                      height: 8,
                      margin: const EdgeInsetsDirectional.only(end: 6),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        color: isCurrent
                            ? AppColors.likudBlue
                            : isAnswered
                                ? AppColors.likudBlue.withValues(alpha: 0.4)
                                : AppColors.border,
                      ),
                    );
                  },
                ),
              ),
            ),

            // Submit button
            if (state.result == null)
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: state.allAnswered && !state.isSubmitting
                      ? () => context
                          .read<DailyQuizBloc>()
                          .add(const SubmitDailyQuiz())
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.likudBlue,
                    disabledBackgroundColor: AppColors.border,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 0),
                  ),
                  child: state.isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.white,
                          ),
                        )
                      : Text(
                          'daily_quiz_submit'.tr(),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletedView(DailyQuiz quiz) {
    return Center(
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.check_circle_outline,
              size: 80,
              color: AppColors.success,
            ),
            const SizedBox(height: 20),
            Text(
              'daily_quiz_completed'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            if (quiz.userScore != null) ...[
              Text(
                'daily_quiz_your_score'.tr(args: [
                  quiz.userScore.toString(),
                  quiz.questions.length.toString(),
                ]),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.likudBlue,
                ),
              ),
              const SizedBox(height: 8),
            ],
            Text(
              'daily_quiz_come_back'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textTertiary,
              ),
            ),
            const SizedBox(height: 32),
            OutlinedButton(
              onPressed: () => context.pop(),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.likudBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding:
                    const EdgeInsetsDirectional.fromSTEB(32, 12, 32, 12),
              ),
              child: Text(
                'daily_quiz_back_to_feed'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.likudBlue,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showResultDialog(BuildContext context, DailyQuizResult result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Text(
            'daily_quiz_results'.tr(),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontWeight: FontWeight.w700,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Score circle
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.likudBlue.withValues(alpha: 0.1),
                  border: Border.all(
                    color: AppColors.likudBlue,
                    width: 3,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${result.score}/${result.totalQuestions}',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.likudBlue,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Points earned
              if (result.pointsAwarded > 0)
                Container(
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.star,
                        color: AppColors.warning,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'daily_quiz_points_earned'
                            .tr(args: [result.pointsAwarded.toString()]),
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  foregroundColor: AppColors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text(
                  'daily_quiz_close'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
