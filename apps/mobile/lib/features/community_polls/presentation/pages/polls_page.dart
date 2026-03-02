import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../bloc/polls_bloc.dart';
import '../widgets/poll_card.dart';

/// Full-screen page displaying the list of community polls.
///
/// Pinned polls appear first, followed by regular polls.
/// Supports pull-to-refresh and shows loading/error/empty states.
class PollsPage extends StatefulWidget {
  const PollsPage({super.key});

  @override
  State<PollsPage> createState() => _PollsPageState();
}

class _PollsPageState extends State<PollsPage> {
  @override
  void initState() {
    super.initState();
    context.read<PollsBloc>().add(const LoadPolls());
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.surfaceLight,
        appBar: AppBar(
          title: Text('polls_title'.tr()),
          centerTitle: true,
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        body: BlocConsumer<PollsBloc, PollsState>(
          listener: (context, state) {
            if (state is PollsLoaded && state.successMessage != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.successMessage!),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 2),
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is PollsLoading) {
              return const Center(
                child: CircularProgressIndicator(
                  color: AppColors.likudBlue,
                ),
              );
            }

            if (state is PollsError) {
              return _ErrorView(
                message: state.message,
                onRetry: () {
                  context.read<PollsBloc>().add(const LoadPolls());
                },
              );
            }

            if (state is PollsLoaded) {
              final polls = state.sortedPolls;

              if (polls.isEmpty) {
                return _EmptyView();
              }

              return RefreshIndicator(
                color: AppColors.likudBlue,
                onRefresh: () async {
                  context.read<PollsBloc>().add(const LoadPolls());
                  // Wait for state to change from loading back to loaded
                  await context.read<PollsBloc>().stream.firstWhere(
                        (s) => s is PollsLoaded || s is PollsError,
                      );
                },
                child: ListView.separated(
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 32),
                  itemCount: polls.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final poll = polls[index];
                    return PollCard(
                      poll: poll,
                      hasVoted: state.hasVoted(poll.id),
                      votedOptionIndex: state.votedOptionIndex(poll.id),
                      isVoting: state.votingPollId == poll.id,
                      onVote: (optionIndex) {
                        context.read<PollsBloc>().add(
                              VoteOnPollEvent(
                                pollId: poll.id,
                                optionIndex: optionIndex,
                              ),
                            );
                      },
                    );
                  },
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}

/// Shown when polls fail to load.
class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsetsDirectional.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text('try_again'.tr()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.likudBlue,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shown when no polls are available.
class _EmptyView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsetsDirectional.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.poll_outlined,
              size: 80,
              color: AppColors.textSecondary.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'polls_no_polls'.tr(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
