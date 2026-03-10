import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../domain/entities/feed_item.dart';
import '../../../community_polls/presentation/bloc/polls_bloc.dart';

/// Card widget for displaying a community poll in the feed with inline voting
class FeedPollCard extends StatefulWidget {
  final FeedPollContent poll;
  final bool isPinned;
  final VoidCallback? onTap;

  const FeedPollCard({
    super.key,
    required this.poll,
    this.isPinned = false,
    this.onTap,
  });

  @override
  State<FeedPollCard> createState() => _FeedPollCardState();
}

class _FeedPollCardState extends State<FeedPollCard> {
  bool _expandedMode = false;

  /// Whether the poll is closed (expired or deactivated).
  /// A closed poll should show results in read-only mode with no voting.
  bool get _isPollClosed {
    if (!widget.poll.isActive) return true;
    if (widget.poll.endsAt != null &&
        widget.poll.endsAt!.isBefore(DateTime.now())) {
      return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<PollsBloc, PollsState>(
      listenWhen: (previous, current) {
        if (current is! PollsLoaded) return false;
        if (previous is! PollsLoaded) return false;
        // Only listen when this poll's voting state changes
        return previous.votingPollId == widget.poll.id &&
            current.votingPollId == null &&
            current.successMessage != null;
      },
      listener: (context, state) {
        if (state is PollsLoaded && state.successMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.successMessage!),
              duration: const Duration(seconds: 2),
              backgroundColor: state.hasVoted(widget.poll.id)
                  ? AppColors.likudBlue
                  : Colors.red[700],
            ),
          );
        }
      },
      child: Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: widget.isPinned ? AppColors.likudBlue : Colors.transparent,
          width: widget.isPinned ? 2 : 0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.likudBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.poll_outlined,
                        color: AppColors.likudBlue,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'community_poll'.tr(),
                        style: TextStyle(
                          color: AppColors.likudBlue,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                if (_isPollClosed)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.red[300]!,
                        width: 1,
                      ),
                    ),
                    child: Text(
                      'polls_closed'.tr(),
                      style: TextStyle(
                        color: Colors.red[700],
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                if (widget.isPinned) ...[
                  if (_isPollClosed) const SizedBox(width: 8),
                  Icon(
                    Icons.push_pin,
                    color: AppColors.likudBlue,
                    size: 18,
                  ),
                ],
              ],
            ),

            const SizedBox(height: 16),

            // Question
            Text(
              widget.poll.question,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                height: 1.3,
                color: context.colors.textPrimary,
              ),
            ),

            const SizedBox(height: 16),

            // Options - show all if expanded, otherwise just first 3
            _buildOptionsSection(context),

            const SizedBox(height: 16),

            // Footer - uses BlocBuilder to reflect voted state
            BlocBuilder<PollsBloc, PollsState>(
              builder: (context, pollsState) {
                final pollClosed = _isPollClosed;
                final int? votedIndex = (pollsState is PollsLoaded)
                    ? (pollsState.votedOptionIndex(widget.poll.id) ?? widget.poll.votedOptionIndex)
                    : widget.poll.votedOptionIndex;
                final bool userHasVoted = votedIndex != null;

                // Show updated total votes (original + 1 if just voted via PollsBloc)
                final int displayTotalVotes = (pollsState is PollsLoaded && pollsState.hasVoted(widget.poll.id) && widget.poll.votedOptionIndex == null)
                    ? widget.poll.totalVotes + 1
                    : widget.poll.totalVotes;

                return Row(
                  children: [
                    // Total votes
                    Icon(Icons.people_outline, size: 16, color: context.colors.textTertiary),
                    const SizedBox(width: 4),
                    Text(
                      '$displayTotalVotes ${'votes'.tr()}',
                      style: TextStyle(
                        fontSize: 13,
                        color: context.colors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    const Spacer(),

                    // Action button or expand button
                    // When poll is closed or user has voted, show "view results"
                    if (pollClosed || userHasVoted)
                      TextButton.icon(
                        onPressed: widget.onTap,
                        icon: Icon(Icons.bar_chart, size: 18),
                        label: Text(
                          'view_results'.tr(),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.likudBlue,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                      )
                    else if (widget.poll.options.length > 3 && !_expandedMode)
                      TextButton.icon(
                        onPressed: () => setState(() => _expandedMode = true),
                        icon: Icon(Icons.expand_more, size: 18),
                        label: Text(
                          '+${widget.poll.options.length - 3} ${'more_options'.tr()}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.likudBlue,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 8,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),

            // Expiration info
            if (widget.poll.endsAt != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.timer_outlined, size: 14, color: context.colors.textTertiary),
                  const SizedBox(width: 4),
                  Text(
                    '${'ends'.tr()}: ${_formatDate(widget.poll.endsAt!)}',
                    style: TextStyle(
                      fontSize: 11,
                      color: context.colors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildOptionsSection(BuildContext context) {
    final optionsToShow =
        _expandedMode ? widget.poll.options : widget.poll.options.take(3).toList();
    final pollClosed = _isPollClosed;

    return BlocBuilder<PollsBloc, PollsState>(
      builder: (context, state) {
        final isVoting = !pollClosed &&
            state is PollsLoaded &&
            state.votingPollId == widget.poll.id;

        // Check both feed data and PollsBloc for voted state
        // PollsBloc tracks optimistic votes made in this session
        final int? votedIndex = (state is PollsLoaded)
            ? (state.votedOptionIndex(widget.poll.id) ?? widget.poll.votedOptionIndex)
            : widget.poll.votedOptionIndex;
        // If poll is closed, always show results (read-only mode)
        final bool showResults = pollClosed || votedIndex != null;

        return Column(
          children: [
            ...optionsToShow.asMap().entries.map((entry) {
              final index = entry.key;
              final option = entry.value;

              return _PollOption(
                option: option,
                optionIndex: index,
                userHasVoted: showResults,
                isThisVote: votedIndex == index,
                isVoting: isVoting,
                onVote: pollClosed ? () {} : () => _onVoteOption(context, index),
                isDisabled: pollClosed,
              );
            }).toList(),
          ],
        );
      },
    );
  }

  void _onVoteOption(BuildContext context, int optionIndex) {
    if (!requireAuth(context)) return;
    final pollsBloc = context.read<PollsBloc>();
    pollsBloc.add(VoteOnPollEvent(
      pollId: widget.poll.id,
      optionIndex: optionIndex,
    ));
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now);

    if (difference.inDays > 1) {
      return '${difference.inDays} ${'days'.tr()}';
    } else if (difference.inHours > 1) {
      return '${difference.inHours} ${'hours'.tr()}';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} ${'minutes'.tr()}';
    } else {
      return 'ended'.tr();
    }
  }
}

/// Widget for displaying a single poll option with voting capability
class _PollOption extends StatelessWidget {
  final FeedPollOption option;
  final int optionIndex;
  final bool userHasVoted;
  final bool isThisVote;
  final bool isVoting;
  final VoidCallback onVote;
  final bool isDisabled;

  const _PollOption({
    required this.option,
    required this.optionIndex,
    required this.userHasVoted,
    required this.isThisVote,
    required this.isVoting,
    required this.onVote,
    this.isDisabled = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: !userHasVoted && !isVoting && !isDisabled ? onVote : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        child: Stack(
          children: [
            // Background progress bar (shown when voted)
            if (userHasVoted)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: AppColors.likudBlue.withValues(alpha: 0.1),
                  ),
                  child: FractionallySizedBox(
                    alignment: AlignmentDirectional.centerStart,
                    widthFactor: option.percentage / 100,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        color: AppColors.likudBlue.withValues(
                          alpha: isThisVote ? 0.5 : 0.3,
                        ),
                      ),
                    ),
                  ),
                ),
              )
            // Hover background for clickable option (not voted)
            else if (!isVoting)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: context.colors.shadow,
                    border: Border.all(
                      color: context.colors.border,
                      width: 1,
                    ),
                  ),
                ),
              )
            // Loading background while voting
            else
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: context.colors.shadow,
                  ),
                ),
              ),

            // Option content
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 44),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    // Checkbox or checkmark icon
                    if (!isVoting)
                      Padding(
                        padding: const EdgeInsetsDirectional.only(end: 8),
                        child: Icon(
                          userHasVoted
                              ? (isThisVote ? Icons.check_circle : Icons.radio_button_unchecked)
                              : Icons.radio_button_unchecked,
                          size: 20,
                          color: userHasVoted && isThisVote
                              ? AppColors.likudBlue
                              : context.colors.textTertiary,
                        ),
                      )
                    else
                      Padding(
                        padding: const EdgeInsetsDirectional.only(end: 8),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation(AppColors.likudBlue),
                          ),
                        ),
                      ),

                    // Option text
                    Expanded(
                      child: Text(
                        option.text,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: userHasVoted && isThisVote
                              ? AppColors.likudBlue
                              : context.colors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    // Percentage (shown when voted)
                    if (userHasVoted) ...[
                      const SizedBox(width: 8),
                      Text(
                        '${option.percentage.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isThisVote
                              ? AppColors.likudBlue
                              : context.colors.textTertiary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
