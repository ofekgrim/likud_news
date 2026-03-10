import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/quiz_question.dart';
import '../bloc/quiz_bloc.dart';
import '../widgets/importance_selector.dart';
import '../widgets/quiz_option_card.dart';
import '../widgets/quiz_progress_bar.dart';

/// Main quiz page with animated question navigation.
///
/// Displays questions one at a time using a [PageView] with animated
/// transitions. Includes a progress bar, option cards, importance selector,
/// and navigation buttons.
class QuizPage extends StatefulWidget {
  final String electionId;

  const QuizPage({super.key, required this.electionId});

  @override
  State<QuizPage> createState() => _QuizPageState();
}

class _QuizPageState extends State<QuizPage> {
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    // Load questions — each route creates a fresh BLoC
    context.read<QuizBloc>().add(
      LoadQuizQuestions(electionId: widget.electionId),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _animateToPage(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.colors.surface,
        appBar: AppBar(
          backgroundColor: context.colors.surface,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.close, color: context.colors.textPrimary),
            onPressed: () => _showExitConfirmation(context),
          ),
          centerTitle: true,
          title: Text(
            'quiz_title'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        body: BlocConsumer<QuizBloc, QuizState>(
          listener: (context, state) {
            if (state is QuizQuestionsLoaded) {
              // Sync page controller with BLoC state
              if (_pageController.hasClients &&
                  _pageController.page?.round() != state.currentIndex) {
                _animateToPage(state.currentIndex);
              }
            }
            if (state is QuizResultsLoaded) {
              context.go('/primaries/quiz/${widget.electionId}/results');
            }
            if (state is QuizError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: AppColors.breakingRed,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is QuizLoading || state is QuizSubmitting) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.likudBlue),
              );
            }

            if (state is QuizQuestionsLoaded) {
              return _buildQuizContent(context, state);
            }

            if (state is QuizError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsetsDirectional.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 48,
                        color: AppColors.breakingRed,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        state.message,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 15,
                          color: context.colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          context.read<QuizBloc>().add(
                            LoadQuizQuestions(electionId: widget.electionId),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.likudBlue,
                          foregroundColor: AppColors.white,
                        ),
                        child: Text('quiz_retry'.tr()),
                      ),
                    ],
                  ),
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildQuizContent(BuildContext context, QuizQuestionsLoaded state) {
    return SafeArea(
      child: Column(
        children: [
          // Progress bar
          Padding(
            padding: const EdgeInsetsDirectional.symmetric(
              horizontal: 20,
              vertical: 12,
            ),
            child: QuizProgressBar(
              currentIndex: state.currentIndex,
              totalQuestions: state.questions.length,
            ),
          ),
          // Questions PageView
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: state.questions.length,
              itemBuilder: (context, index) {
                final question = state.questions[index];
                final answer = state.answers[question.id];
                return _buildQuestionCard(
                  context,
                  question,
                  answer?.selectedValue,
                  answer?.importance ?? _defaultImportance(question.importance),
                );
              },
            ),
          ),
          // Navigation buttons
          _buildNavigationButtons(context, state),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(
    BuildContext context,
    QuizQuestion question,
    double? selectedValue,
    int importance,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 8),
          // Category badge
          if (question.category != null && question.category!.isNotEmpty) ...[
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Container(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.likudBlue.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  question.category!,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.likudBlue,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          // Question text
          Text(
            question.questionText,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          // Options
          ...question.options.map(
            (option) => Padding(
              padding: const EdgeInsetsDirectional.only(bottom: 10),
              child: QuizOptionCard(
                option: option,
                isSelected: selectedValue == option.value,
                onSelected: (selected) {
                  context.read<QuizBloc>().add(
                    AnswerQuestion(
                      questionId: question.id,
                      selectedValue: selected.value,
                      importance: importance,
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Importance selector (only show if question has been answered)
          if (selectedValue != null) ...[
            ImportanceSelector(
              selectedImportance: importance,
              onChanged: (newImportance) {
                context.read<QuizBloc>().add(
                  UpdateImportance(
                    questionId: question.id,
                    importance: newImportance,
                  ),
                );
              },
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons(
    BuildContext context,
    QuizQuestionsLoaded state,
  ) {
    return Container(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 20,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: context.colors.surface,
        boxShadow: [
          BoxShadow(
            color: context.colors.shadow,
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Previous button
          if (!state.isFirstQuestion)
            Expanded(
              child: SizedBox(
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.read<QuizBloc>().add(const PreviousQuestion());
                  },
                  icon: const Icon(Icons.arrow_forward, size: 18),
                  label: Text('quiz_previous'.tr()),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.colors.textPrimary,
                    side: BorderSide(color: context.colors.border),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    textStyle: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),
          if (!state.isFirstQuestion) const SizedBox(width: 12),
          // Next / Submit button
          Expanded(
            child: SizedBox(
              height: 48,
              child: state.isLastQuestion
                  ? ElevatedButton.icon(
                      onPressed: state.currentAnswered
                          ? () {
                              context.read<QuizBloc>().add(
                                SubmitQuizEvent(electionId: widget.electionId),
                              );
                            }
                          : null,
                      icon: const Icon(Icons.check, size: 18),
                      label: Text('quiz_submit'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        foregroundColor: AppColors.white,
                        disabledBackgroundColor: AppColors.success.withValues(
                          alpha: 0.4,
                        ),
                        disabledForegroundColor: AppColors.white.withValues(
                          alpha: 0.7,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                        textStyle: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    )
                  : ElevatedButton.icon(
                      onPressed: state.currentAnswered
                          ? () {
                              context.read<QuizBloc>().add(
                                const NextQuestion(),
                              );
                            }
                          : null,
                      icon: const Icon(Icons.arrow_forward, size: 18),
                      label: Text('quiz_next'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.likudBlue,
                        foregroundColor: AppColors.white,
                        disabledBackgroundColor: AppColors.likudBlue.withValues(
                          alpha: 0.4,
                        ),
                        disabledForegroundColor: AppColors.white.withValues(
                          alpha: 0.7,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                        textStyle: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  /// Maps the question's default importance hint to a numeric value.
  int _defaultImportance(String importance) {
    switch (importance) {
      case 'low':
        return 1;
      case 'high':
        return 3;
      case 'medium':
      default:
        return 2;
    }
  }

  void _showExitConfirmation(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
          'quiz_exit_title'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontWeight: FontWeight.w700,
          ),
          textDirection: TextDirection.rtl,
        ),
        content: Text(
          'quiz_exit_message'.tr(),
          style: const TextStyle(fontFamily: 'Heebo'),
          textDirection: TextDirection.rtl,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(
              'quiz_exit_cancel'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                color: context.colors.textSecondary,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop(true);
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/primaries/quiz');
              }
            },
            child: Text(
              'quiz_exit_confirm'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                color: AppColors.breakingRed,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
