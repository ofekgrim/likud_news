import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/policy_statement.dart';
import '../bloc/candidate_matcher_bloc.dart';
import '../widgets/importance_slider.dart';
import '../widgets/question_card.dart';

/// Page displaying policy statements one at a time with
/// agree/disagree/skip buttons. After all questions, shows
/// an optional importance weights screen before submission.
class MatcherQuestionsPage extends StatefulWidget {
  final String electionId;

  const MatcherQuestionsPage({super.key, required this.electionId});

  @override
  State<MatcherQuestionsPage> createState() => _MatcherQuestionsPageState();
}

class _MatcherQuestionsPageState extends State<MatcherQuestionsPage> {
  /// Whether the user is on the importance weights screen.
  bool _showImportanceScreen = false;

  @override
  void initState() {
    super.initState();
    context.read<CandidateMatcherBloc>().add(
          LoadStatements(electionId: widget.electionId),
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
            icon: Icon(Icons.arrow_forward, color: context.colors.textPrimary),
            onPressed: () => _handleBack(context),
          ),
          centerTitle: true,
          title: Text(
            'matcher_title'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        body: BlocConsumer<CandidateMatcherBloc, CandidateMatcherState>(
          listener: (context, state) {
            if (state is CandidateMatcherResultsLoaded) {
              context.pushReplacement(
                '/primaries/matcher/results/${widget.electionId}',
              );
            } else if (state is CandidateMatcherError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    state.failure.message ?? 'matcher_error'.tr(),
                  ),
                  backgroundColor: AppColors.breakingRed,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is CandidateMatcherLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is CandidateMatcherSubmitting) {
              return _buildSubmittingView(context);
            }

            if (state is CandidateMatcherQuestionsLoaded) {
              if (_showImportanceScreen) {
                return _buildImportanceScreen(context, state);
              }
              return _buildQuestionsView(context, state);
            }

            if (state is CandidateMatcherError) {
              return _buildErrorView(context, state);
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  void _handleBack(BuildContext context) {
    if (_showImportanceScreen) {
      setState(() => _showImportanceScreen = false);
      return;
    }

    final state = context.read<CandidateMatcherBloc>().state;
    if (state is CandidateMatcherQuestionsLoaded && state.answeredCount > 0) {
      showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(
            'matcher_exit_title'.tr(),
            textDirection: TextDirection.rtl,
            style: const TextStyle(fontFamily: 'Heebo'),
          ),
          content: Text(
            'matcher_exit_message'.tr(),
            textDirection: TextDirection.rtl,
            style: const TextStyle(fontFamily: 'Heebo'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(
                'matcher_exit_cancel'.tr(),
                style: const TextStyle(fontFamily: 'Heebo'),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(
                'matcher_exit_confirm'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  color: AppColors.breakingRed,
                ),
              ),
            ),
          ],
        ),
      ).then((confirmed) {
        if (confirmed == true && context.mounted) {
          context.pop();
        }
      });
    } else {
      context.pop();
    }
  }

  Widget _buildQuestionsView(
    BuildContext context,
    CandidateMatcherQuestionsLoaded state,
  ) {
    final currentStatement = state.statements[state.currentIndex];

    return SafeArea(
      child: Column(
        children: [
          // Progress bar
          _buildProgressBar(context, state),
          // Question card
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  const SizedBox(height: 8),
                  // Question counter
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
                    child: Text(
                      'matcher_question_of'.tr(args: [
                        '${state.currentIndex + 1}',
                        '${state.totalQuestions}',
                      ]),
                      textDirection: TextDirection.rtl,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        color: context.colors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  QuestionCard(
                    statement: currentStatement,
                    currentAnswer: state.answers[currentStatement.id],
                    onAnswer: (answer) {
                      context.read<CandidateMatcherBloc>().add(
                            AnswerStatement(
                              statementId: currentStatement.id,
                              answer: answer,
                            ),
                          );
                    },
                  ),
                ],
              ),
            ),
          ),
          // Navigation buttons
          _buildNavigationButtons(context, state),
        ],
      ),
    );
  }

  Widget _buildProgressBar(
    BuildContext context,
    CandidateMatcherQuestionsLoaded state,
  ) {
    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: state.totalQuestions > 0
                  ? state.answeredCount / state.totalQuestions
                  : 0,
              backgroundColor: context.colors.surfaceVariant,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.likudBlue),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${state.answeredCount}/${state.totalQuestions}',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  color: context.colors.textTertiary,
                ),
              ),
              Text(
                '${((state.answeredCount / state.totalQuestions) * 100).round()}%',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.likudBlue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons(
    BuildContext context,
    CandidateMatcherQuestionsLoaded state,
  ) {
    final isFirst = state.currentIndex == 0;
    final isLast = state.currentIndex == state.totalQuestions - 1;
    final hasAnswer = state.answers.containsKey(
      state.statements[state.currentIndex].id,
    );

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 16),
      child: Row(
        children: [
          // Previous button
          if (!isFirst)
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  context.read<CandidateMatcherBloc>().add(
                        NavigateToQuestion(
                          index: state.currentIndex - 1,
                        ),
                      );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: context.colors.textPrimary,
                  side: BorderSide(color: context.colors.border),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  'matcher_previous'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          if (!isFirst) const SizedBox(width: 12),
          // Next / Finish button
          Expanded(
            child: ElevatedButton(
              onPressed: hasAnswer
                  ? () {
                      if (isLast) {
                        // Move to importance screen
                        setState(() => _showImportanceScreen = true);
                      } else {
                        context.read<CandidateMatcherBloc>().add(
                              NavigateToQuestion(
                                index: state.currentIndex + 1,
                              ),
                            );
                      }
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.likudBlue,
                foregroundColor: AppColors.white,
                disabledBackgroundColor:
                    AppColors.likudBlue.withValues(alpha: 0.4),
                disabledForegroundColor: AppColors.white.withValues(alpha: 0.7),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
              ),
              child: Text(
                isLast ? 'matcher_set_importance'.tr() : 'matcher_next'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImportanceScreen(
    BuildContext context,
    CandidateMatcherQuestionsLoaded state,
  ) {
    // Collect unique categories from the statements
    final categories = <PolicyCategory>{};
    for (final s in state.statements) {
      categories.add(s.category);
    }

    return SafeArea(
      child: Column(
        children: [
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
            child: Text(
              'matcher_set_importance'.tr(),
              textDirection: TextDirection.rtl,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: context.colors.textPrimary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
            child: Text(
              'matcher_importance_description'.tr(),
              textDirection: TextDirection.rtl,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: context.colors.textSecondary,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              children: categories.map((category) {
                final key = category.name;
                return ImportanceSlider(
                  categoryKey: key,
                  categoryLabel: _categoryLabel(category),
                  value: state.categoryWeights[key] ?? 1.0,
                  onChanged: (value) {
                    context.read<CandidateMatcherBloc>().add(
                          SetImportanceWeight(category: key, weight: value),
                        );
                  },
                );
              }).toList(),
            ),
          ),
          // Submit button
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 16),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  context.read<CandidateMatcherBloc>().add(
                        SubmitMatcherResponses(electionId: widget.electionId),
                      );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  foregroundColor: AppColors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'matcher_submit'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
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

  Widget _buildSubmittingView(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.likudBlue),
          const SizedBox(height: 24),
          Text(
            'matcher_submitting'.tr(),
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              color: context.colors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(BuildContext context, CandidateMatcherError state) {
    return Center(
      child: Padding(
        padding: const EdgeInsetsDirectional.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: context.colors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              state.failure.message ?? 'matcher_error'.tr(),
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                color: context.colors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                context.read<CandidateMatcherBloc>().add(
                      LoadStatements(electionId: widget.electionId),
                    );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.likudBlue,
                foregroundColor: AppColors.white,
              ),
              child: Text(
                'retry'.tr(),
                style: const TextStyle(fontFamily: 'Heebo'),
              ),
            ),
          ],
        ),
      ),
    );
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
