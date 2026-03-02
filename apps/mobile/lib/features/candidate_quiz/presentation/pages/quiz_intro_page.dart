import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../bloc/quiz_bloc.dart';
import '../../../../core/utils/auth_guard.dart';

/// Introduction page for the candidate matching quiz.
///
/// Displays a hero illustration, title, description, number of questions,
/// and a "Start Quiz" CTA button. Includes a link to view previous results.
class QuizIntroPage extends StatefulWidget {
  final String electionId;

  const QuizIntroPage({super.key, required this.electionId});

  @override
  State<QuizIntroPage> createState() => _QuizIntroPageState();
}

class _QuizIntroPageState extends State<QuizIntroPage> {
  /// Set to true once the user taps "View previous results".
  bool _requestedPreviousResults = false;

  /// Holds the resolved election UUID (may differ from widget.electionId if 'active').
  String get _resolvedElectionId {
    final state = context.read<QuizBloc>().state;
    if (state is QuizQuestionsLoaded) return state.electionId;
    return widget.electionId;
  }

  @override
  void initState() {
    super.initState();
    // Pre-load questions so we can show the count
    context.read<QuizBloc>().add(
          LoadQuizQuestions(electionId: widget.electionId),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.white,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.textPrimary),
            onPressed: () => context.pop(),
          ),
          centerTitle: true,
          title: Text(
            'quiz_title'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        body: BlocConsumer<QuizBloc, QuizState>(
          listener: (context, state) {
            if (state is QuizResultsLoaded) {
              // If results are loaded, navigate to results page
              context.push(
                '/primaries/quiz/${_resolvedElectionId}/results',
              );
            } else if (state is QuizInitial && _requestedPreviousResults) {
              _requestedPreviousResults = false;
              // No previous results — show feedback
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('quiz_no_previous_results'.tr()),
                  backgroundColor: AppColors.textSecondary,
                  duration: const Duration(seconds: 2),
                ),
              );
              // Re-load questions so the intro page works normally
              context.read<QuizBloc>().add(
                    LoadQuizQuestions(electionId: widget.electionId),
                  );
            }
          },
          builder: (context, state) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          children: [
                            const SizedBox(height: 24),
                            // Hero illustration area
                            _buildHeroIllustration(),
                            const SizedBox(height: 32),
                            // Title
                            Text(
                              'quiz_intro_title'.tr(),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                                height: 1.3,
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Description
                            Text(
                              'quiz_intro_description'.tr(),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 15,
                                color: AppColors.textSecondary,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 24),
                            // Number of questions badge
                            _buildQuestionCountBadge(state),
                            const SizedBox(height: 16),
                            // Features list
                            _buildFeaturesList(),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ),
                    // Bottom buttons
                    _buildBottomActions(context, state),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeroIllustration() {
    return Container(
      width: double.infinity,
      height: 180,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.likudBlue.withValues(alpha: 0.08),
            AppColors.likudBlue.withValues(alpha: 0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.likudBlue.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.quiz_outlined,
              size: 40,
              color: AppColors.likudBlue,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsetsDirectional.symmetric(
              horizontal: 16,
              vertical: 6,
            ),
            decoration: BoxDecoration(
              color: AppColors.likudBlue,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'quiz_badge_label'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCountBadge(QuizState state) {
    int questionCount = 0;
    if (state is QuizQuestionsLoaded) {
      questionCount = state.questions.length;
    }

    if (questionCount == 0) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 16,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.format_list_numbered,
            size: 20,
            color: AppColors.likudBlue,
          ),
          const SizedBox(width: 8),
          Text(
            'quiz_question_count'.tr(
              namedArgs: {'count': '$questionCount'},
            ),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.timer_outlined,
            size: 18,
            color: AppColors.textTertiary,
          ),
          const SizedBox(width: 4),
          Text(
            'quiz_estimated_time'.tr(
              namedArgs: {
                'minutes': '${(questionCount * 0.5).ceil()}',
              },
            ),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturesList() {
    return Column(
      children: [
        _buildFeatureRow(
          icon: Icons.check_circle_outline,
          textKey: 'quiz_feature_anonymous',
        ),
        const SizedBox(height: 10),
        _buildFeatureRow(
          icon: Icons.bar_chart_outlined,
          textKey: 'quiz_feature_match',
        ),
        const SizedBox(height: 10),
        _buildFeatureRow(
          icon: Icons.share_outlined,
          textKey: 'quiz_feature_share',
        ),
      ],
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required String textKey,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppColors.success,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            textKey.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActions(BuildContext context, QuizState state) {
    final isReady = state is QuizQuestionsLoaded;
    final isLoading = state is QuizLoading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Start Quiz button
        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: isReady
                ? () {
                    if (!requireAuth(context)) return;
                    context.push('/primaries/quiz/${_resolvedElectionId}/questions');
                  }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.likudBlue,
              foregroundColor: AppColors.white,
              disabledBackgroundColor: AppColors.likudBlue.withValues(alpha: 0.4),
              disabledForegroundColor: AppColors.white.withValues(alpha: 0.7),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.white,
                    ),
                  )
                : Text(
                    'quiz_start'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 12),
        // View previous results link
        Center(
          child: TextButton(
            onPressed: () {
              _requestedPreviousResults = true;
              context.read<QuizBloc>().add(
                    LoadMyResults(electionId: _resolvedElectionId),
                  );
            },
            child: Text(
              'quiz_view_previous_results'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.likudBlue,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
