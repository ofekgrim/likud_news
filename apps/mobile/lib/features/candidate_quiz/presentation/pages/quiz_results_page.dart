import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/community_average.dart';
import '../../domain/entities/quiz_result.dart';
import '../bloc/quiz_bloc.dart';
import '../widgets/candidate_match_card.dart';
import '../widgets/community_comparison_section.dart';
import '../widgets/match_percentage_circle.dart';
import '../../../../core/sharing/share_button.dart';
import '../../../../core/sharing/models/share_link.dart';

/// Results page showing ranked candidate matches after quiz completion.
///
/// Displays the best match prominently at the top, followed by a ranked
/// list of all candidates with their match percentages.
class QuizResultsPage extends StatefulWidget {
  final String electionId;

  const QuizResultsPage({super.key, required this.electionId});

  @override
  State<QuizResultsPage> createState() => _QuizResultsPageState();
}

class _QuizResultsPageState extends State<QuizResultsPage> {
  String get electionId => widget.electionId;

  @override
  void initState() {
    super.initState();
    // Load results — each route creates a fresh BLoC
    context.read<QuizBloc>().add(
          LoadMyResults(electionId: electionId),
        );
    // Also load community averages for comparison
    context.read<QuizBloc>().add(
          LoadQuizAverages(electionId: electionId),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.colors.surfaceVariant,
        appBar: AppBar(
          backgroundColor: context.colors.cardSurface,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.close, color: context.colors.textPrimary),
            onPressed: () => context.pop(),
          ),
          centerTitle: true,
          title: Text(
            'quiz_results_title'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
          actions: [
            BlocBuilder<QuizBloc, QuizState>(
              builder: (context, state) {
                if (state is QuizResultsLoaded && state.matchResults.isNotEmpty) {
                  final sorted = List<CandidateMatch>.from(state.matchResults)
                    ..sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));
                  final best = sorted.first;
                  return WhatsAppShareButton(
                    contentType: ShareContentType.quizResult,
                    contentId: electionId,
                    shareText: 'quiz_share_text'.tr(args: [
                      best.candidateName,
                      best.matchPercentage.toString(),
                    ]),
                    title: 'quiz_share_header'.tr(),
                    description: 'quiz_share_text'.tr(args: [
                      best.candidateName,
                      best.matchPercentage.toString(),
                    ]),
                  );
                }
                return IconButton(
                  icon: const Icon(Icons.share_outlined, color: AppColors.likudBlue),
                  onPressed: () => _shareResults(context),
                );
              },
            ),
          ],
        ),
        body: BlocBuilder<QuizBloc, QuizState>(
          builder: (context, state) {
            if (state is QuizLoading) {
              return const Center(
                child: CircularProgressIndicator(
                  color: AppColors.likudBlue,
                ),
              );
            }

            if (state is QuizResultsLoaded) {
              return _buildResultsContent(
                context,
                state.matchResults,
                state.communityAverages,
              );
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
                                LoadMyResults(electionId: electionId),
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

  Widget _buildResultsContent(
    BuildContext context,
    List<CandidateMatch> matchResults,
    List<CommunityAverage>? communityAverages,
  ) {
    if (matchResults.isEmpty) {
      return Center(
        child: Text(
          'quiz_no_results'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 16,
            color: context.colors.textSecondary,
          ),
        ),
      );
    }

    // Sort by match percentage descending
    final sorted = List<CandidateMatch>.from(matchResults)
      ..sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));

    final bestMatch = sorted.first;

    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 20,
        vertical: 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Best match hero section
          _buildBestMatchSection(context, bestMatch),
          const SizedBox(height: 24),
          // Section title
          Text(
            'quiz_all_matches'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          // All matches list
          ...sorted.asMap().entries.map(
                (entry) => CandidateMatchCard(
                  match: entry.value,
                  rank: entry.key + 1,
                  isBestMatch: entry.key == 0,
                  onTap: () {
                    context.push(
                      '/candidates/${entry.value.candidateId}',
                    );
                  },
                ),
              ),
          const SizedBox(height: 24),
          // Community comparison section
          if (communityAverages != null && communityAverages.isNotEmpty)
            CommunityComparisonSection(
              userResults: sorted,
              communityAverages: communityAverages,
            ),
          if (communityAverages != null && communityAverages.isNotEmpty)
            const SizedBox(height: 24),
          // Bottom actions
          _buildBottomActions(context),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildBestMatchSection(
    BuildContext context,
    CandidateMatch bestMatch,
  ) {
    return Container(
      padding: const EdgeInsetsDirectional.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.likudBlue.withValues(alpha: 0.08),
            context.colors.cardSurface,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.likudBlue.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        children: [
          // Trophy icon
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.likudBlue.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.emoji_events_outlined,
              size: 28,
              color: AppColors.likudBlue,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'quiz_your_best_match'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: context.colors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            bestMatch.candidateName,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          MatchPercentageCircle(
            percentage: bestMatch.matchPercentage,
            size: 100,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton.icon(
              onPressed: () {
                context.push('/candidates/${bestMatch.candidateId}');
              },
              icon: const Icon(Icons.person_outline, size: 18),
              label: Text('quiz_view_candidate'.tr()),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.likudBlue,
                side: const BorderSide(color: AppColors.likudBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // WhatsApp Share Results button
        BlocBuilder<QuizBloc, QuizState>(
          builder: (context, state) {
            if (state is QuizResultsLoaded && state.matchResults.isNotEmpty) {
              final sorted = List<CandidateMatch>.from(state.matchResults)
                ..sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));
              final best = sorted.first;
              return WhatsAppShareButton(
                contentType: ShareContentType.quizResult,
                contentId: electionId,
                shareText: 'quiz_share_text'.tr(args: [
                  best.candidateName,
                  best.matchPercentage.toString(),
                ]),
                title: 'quiz_share_header'.tr(),
                description: 'quiz_share_text'.tr(args: [
                  best.candidateName,
                  best.matchPercentage.toString(),
                ]),
                showLabel: true,
              );
            }
            return SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () => _shareResults(context),
                icon: const Icon(Icons.share_outlined, size: 18),
                label: Text('quiz_share_results'.tr()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  foregroundColor: AppColors.white,
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
            );
          },
        ),
        const SizedBox(height: 12),
        // Retake Quiz button
        SizedBox(
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () {
              context.read<QuizBloc>().add(
                    LoadQuizQuestions(electionId: electionId),
                  );
              context.go('/primaries/quiz/$electionId/questions');
            },
            icon: const Icon(Icons.refresh, size: 18),
            label: Text('quiz_retake'.tr()),
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
      ],
    );
  }

  void _shareResults(BuildContext context) {
    final state = context.read<QuizBloc>().state;
    if (state is! QuizResultsLoaded) return;

    final results = List<CandidateMatch>.from(state.matchResults)
      ..sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));

    final buffer = StringBuffer();
    buffer.writeln('quiz_share_header'.tr());
    buffer.writeln();

    for (int i = 0; i < results.length && i < 5; i++) {
      final match = results[i];
      buffer.writeln(
        '${i + 1}. ${match.candidateName} — ${match.matchPercentage}%',
      );
    }

    buffer.writeln();
    buffer.writeln('quiz_share_footer'.tr());

    Share.share(buffer.toString());
  }
}
