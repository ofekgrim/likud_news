import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../bloc/candidate_matcher_bloc.dart';
import '../widgets/category_radar_chart.dart';
import '../widgets/match_result_card.dart';

/// Results page showing the top matched candidates with percentage bars,
/// a radar chart for category breakdown, share and compare buttons.
class MatcherResultsPage extends StatefulWidget {
  final String electionId;

  const MatcherResultsPage({super.key, required this.electionId});

  @override
  State<MatcherResultsPage> createState() => _MatcherResultsPageState();
}

class _MatcherResultsPageState extends State<MatcherResultsPage> {
  @override
  void initState() {
    super.initState();
    // If we don't have results yet (fresh BLoC after navigation), fetch from
    // backend. The questions page already submitted responses; this just
    // retrieves the cached computation via GET /primaries/matcher/match/:id.
    final state = context.read<CandidateMatcherBloc>().state;
    if (state is! CandidateMatcherResultsLoaded) {
      context.read<CandidateMatcherBloc>().add(
            LoadMatchResults(electionId: widget.electionId),
          );
    }
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
            onPressed: () => context.pop(),
          ),
          centerTitle: true,
          title: Text(
            'matcher_your_top_matches'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        body: BlocBuilder<CandidateMatcherBloc, CandidateMatcherState>(
          builder: (context, state) {
            if (state is CandidateMatcherSubmitting ||
                state is CandidateMatcherLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is CandidateMatcherResultsLoaded) {
              return _buildResultsView(context, state);
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

  Widget _buildResultsView(
    BuildContext context,
    CandidateMatcherResultsLoaded state,
  ) {
    final matches = state.matches;
    final topMatches = matches.take(5).toList();

    if (topMatches.isEmpty) {
      return Center(
        child: Text(
          'matcher_no_results'.tr(),
          textDirection: TextDirection.rtl,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 16,
            color: context.colors.textSecondary,
          ),
        ),
      );
    }

    return SafeArea(
      child: ListView(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 100),
        children: [
          // Summary badge
          _buildSummaryBadge(context, state),
          const SizedBox(height: 16),
          // Top matches list
          ...topMatches.asMap().entries.map((entry) {
            final rank = entry.key + 1;
            final match = entry.value;
            return MatchResultCard(
              result: match,
              rank: rank,
              onTap: () => context.push('/candidate/${match.candidateId}'),
            );
          }),
          const SizedBox(height: 16),
          // Radar chart for best match
          if (topMatches.isNotEmpty &&
              topMatches.first.categoryBreakdown.isNotEmpty)
            Container(
              decoration: BoxDecoration(
                color: context.colors.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.border),
              ),
              child: CategoryRadarChart(result: topMatches.first),
            ),
          const SizedBox(height: 24),
          // Action buttons
          _buildShareButton(context, state),
          const SizedBox(height: 12),
          if (topMatches.length >= 2)
            _buildCompareButton(context, topMatches),
          const SizedBox(height: 12),
          _buildRetakeButton(context),
        ],
      ),
    );
  }

  Widget _buildSummaryBadge(
    BuildContext context,
    CandidateMatcherResultsLoaded state,
  ) {
    return Container(
      padding: const EdgeInsetsDirectional.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.likudBlue.withValues(alpha: 0.08),
            AppColors.likudBlue.withValues(alpha: 0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.likudBlue.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.likudBlue.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.how_to_vote,
              color: AppColors.likudBlue,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'matcher_results_summary'.tr(args: [
                    '${state.matchResponse.totalAnswered}',
                    '${state.matchResponse.totalStatements}',
                  ]),
                  textDirection: TextDirection.rtl,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: context.colors.textSecondary,
                  ),
                ),
                if (state.matches.isNotEmpty)
                  Text(
                    'matcher_best_match'.tr(),
                    textDirection: TextDirection.rtl,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.likudBlue,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShareButton(
    BuildContext context,
    CandidateMatcherResultsLoaded state,
  ) {
    final bestMatch = state.matches.isNotEmpty ? state.matches.first : null;

    return SizedBox(
      height: 48,
      child: ElevatedButton.icon(
        onPressed: bestMatch != null
            ? () {
                final shareText = 'matcher_share_text'.tr(args: [
                  bestMatch.candidateName,
                  '${bestMatch.matchPct.round()}',
                ]);
                Share.share(shareText);
              }
            : null,
        icon: const Icon(Icons.share, size: 20),
        label: Text(
          'matcher_share_results'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontWeight: FontWeight.w600,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF25D366),
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildCompareButton(
    BuildContext context,
    List<dynamic> topMatches,
  ) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        onPressed: () {
          final top2Ids = topMatches
              .take(2)
              .map((m) => m.candidateId as String)
              .toList();
          context.push('/primaries/compare', extra: top2Ids);
        },
        icon: const Icon(Icons.compare_arrows, size: 20),
        label: Text(
          'matcher_compare_top2'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontWeight: FontWeight.w600,
          ),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.likudBlue,
          side: const BorderSide(color: AppColors.likudBlue),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildRetakeButton(BuildContext context) {
    return SizedBox(
      height: 48,
      child: TextButton.icon(
        onPressed: () {
          context.read<CandidateMatcherBloc>().add(const RetakeQuiz());
          context.pop();
        },
        icon: Icon(
          Icons.refresh,
          size: 20,
          color: context.colors.textSecondary,
        ),
        label: Text(
          'matcher_retake'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontWeight: FontWeight.w600,
            color: context.colors.textSecondary,
          ),
        ),
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
              onPressed: () => context.pop(),
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
}
