import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/ama_sessions_bloc.dart';
import '../widgets/ama_question_card.dart';
import '../widgets/question_input.dart';

/// Displays a single AMA session with its questions and (if live) an input
/// to submit a new question.
///
/// The app bar shows a blinking red dot when the session is currently live.
class AmaLivePage extends StatefulWidget {
  final String sessionId;

  const AmaLivePage({super.key, required this.sessionId});

  @override
  State<AmaLivePage> createState() => _AmaLivePageState();
}

class _AmaLivePageState extends State<AmaLivePage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    context
        .read<AmaSessionsBloc>()
        .add(LoadSessionDetail(widget.sessionId));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AmaSessionsBloc, AmaSessionsState>(
      builder: (context, state) {
        if (state is AmaLoading || state is AmaInitial) {
          return _buildLoadingScaffold(context);
        }

        if (state is AmaError) {
          return Scaffold(
            appBar: _buildAppBar(context, null),
            body: ErrorView(
              message: state.message,
              onRetry: () => context
                  .read<AmaSessionsBloc>()
                  .add(LoadSessionDetail(widget.sessionId)),
            ),
          );
        }

        if (state is AmaSessionDetailLoaded) {
          return _buildLoadedScaffold(context, state);
        }

        return Scaffold(
          appBar: _buildAppBar(context, null),
          body: const SizedBox.shrink(),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Loaded scaffold
  // ---------------------------------------------------------------------------

  Widget _buildLoadedScaffold(
    BuildContext context,
    AmaSessionDetailLoaded state,
  ) {
    final session = state.session;
    final questions = state.sortedQuestions;

    return Scaffold(
      backgroundColor: context.colors.surface,
      appBar: _buildAppBar(context, session.isLive ? true : null),
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                // Session info card
                SliverToBoxAdapter(
                  child: _buildInfoCard(context, state),
                ),

                // Questions list or empty state
                if (questions.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsetsDirectional.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline,
                              size: 56,
                              color: context.colors.textTertiary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'ama.be_first_to_ask'.tr(),
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 15,
                                color: context.colors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: EdgeInsetsDirectional.fromSTEB(
                      16,
                      0,
                      16,
                      session.isLive ? 16 : 100,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final q = questions[index];
                          return Padding(
                            padding: const EdgeInsetsDirectional.only(
                              bottom: 12,
                            ),
                            child: AmaQuestionCard(
                              question: q,
                              onUpvote: () => context
                                  .read<AmaSessionsBloc>()
                                  .add(UpvoteQuestion(q.id)),
                            ),
                          );
                        },
                        childCount: questions.length,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Question input — shown only when session is live
          if (session.isLive)
            QuestionInput(
              isSubmitting: state.isSubmitting,
              onSubmit: (text) => context.read<AmaSessionsBloc>().add(
                    SubmitQuestion(
                      sessionId: widget.sessionId,
                      text: text,
                    ),
                  ),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Session info card
  // ---------------------------------------------------------------------------

  Widget _buildInfoCard(BuildContext context, AmaSessionDetailLoaded state) {
    final session = state.session;

    final Color statusColor;
    final String statusLabel;
    final IconData statusIcon;

    if (session.isLive) {
      statusColor = AppColors.breakingRed;
      statusLabel = 'ama.live_now'.tr();
      statusIcon = Icons.fiber_manual_record;
    } else if (session.isScheduled) {
      statusColor = AppColors.likudBlue;
      statusLabel = 'ama.upcoming'.tr();
      statusIcon = Icons.event;
    } else {
      statusColor = context.colors.textSecondary;
      statusLabel = 'ama.ended'.tr();
      statusIcon = Icons.check_circle_outline;
    }

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 12),
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: session.isLive
                ? AppColors.breakingRed.withValues(alpha: 0.3)
                : context.colors.border,
          ),
        ),
        padding: const EdgeInsetsDirectional.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badge
            Container(
              padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 8, 4),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (session.isLive)
                    FadeTransition(
                      opacity: _pulseController,
                      child: Icon(
                        statusIcon,
                        size: 12,
                        color: statusColor,
                      ),
                    )
                  else
                    Icon(statusIcon, size: 14, color: statusColor),
                  const SizedBox(width: 4),
                  Text(
                    statusLabel,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Candidate name
            Text(
              session.candidateName,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.likudBlue,
              ),
            ),

            const SizedBox(height: 6),

            // Description
            if (session.description != null &&
                session.description!.isNotEmpty) ...[
              Text(
                session.description!,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: context.colors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Question count
            Row(
              children: [
                Icon(
                  Icons.chat_bubble_outline,
                  size: 15,
                  color: context.colors.textSecondary.withValues(alpha: 0.7),
                ),
                const SizedBox(width: 5),
                Text(
                  '${session.questionCount} ${'ama.questions_count'.tr()}',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    color:
                        context.colors.textSecondary.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  AppBar _buildAppBar(BuildContext context, bool? isLive) {
    return AppBar(
      centerTitle: true,
      title: BlocBuilder<AmaSessionsBloc, AmaSessionsState>(
        builder: (context, state) {
          final title = state is AmaSessionDetailLoaded
              ? state.session.title
              : 'ama.sessions_title'.tr();
          final live = state is AmaSessionDetailLoaded
              ? state.session.isLive
              : (isLive ?? false);

          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (live) ...[
                FadeTransition(
                  opacity: _pulseController,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: AppColors.breakingRed,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: context.colors.textPrimary,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLoadingScaffold(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.surface,
      appBar: _buildAppBar(context, null),
      body: ListView(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 100),
        children: [
          // Info card shimmer
          Container(
            height: 140,
            decoration: BoxDecoration(
              color: context.colors.cardSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.colors.border),
            ),
            padding: const EdgeInsetsDirectional.all(16),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerLoading(width: 80, height: 24, borderRadius: 8),
                SizedBox(height: 12),
                ShimmerLoading(width: 140, height: 16, borderRadius: 4),
                SizedBox(height: 8),
                ShimmerLoading(
                  width: double.infinity,
                  height: 14,
                  borderRadius: 4,
                ),
                SizedBox(height: 6),
                ShimmerLoading(width: 200, height: 14, borderRadius: 4),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Question shimmer cards
          ...List.generate(
            5,
            (_) => Padding(
              padding: const EdgeInsetsDirectional.only(bottom: 12),
              child: Container(
                height: 110,
                decoration: BoxDecoration(
                  color: context.colors.cardSurface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.border),
                ),
                padding: const EdgeInsetsDirectional.all(16),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ShimmerLoading(
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                        ),
                        SizedBox(width: 8),
                        ShimmerLoading(width: 100, height: 14, borderRadius: 4),
                      ],
                    ),
                    SizedBox(height: 10),
                    ShimmerLoading(
                      width: double.infinity,
                      height: 14,
                      borderRadius: 4,
                    ),
                    SizedBox(height: 6),
                    ShimmerLoading(width: 220, height: 14, borderRadius: 4),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
