import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/community_poll.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../../../core/sharing/share_button.dart';
import '../../../../core/sharing/models/share_link.dart';

/// A card widget that displays a single community poll.
///
/// Shows the question, description, and either voting options (if the user
/// hasn't voted) or animated result bars (if the user has voted or the
/// poll is closed).
class PollCard extends StatefulWidget {
  final CommunityPoll poll;
  final bool hasVoted;
  final int? votedOptionIndex;
  final bool isVoting;
  final ValueChanged<int> onVote;

  const PollCard({
    super.key,
    required this.poll,
    required this.hasVoted,
    this.votedOptionIndex,
    this.isVoting = false,
    required this.onVote,
  });

  @override
  State<PollCard> createState() => _PollCardState();
}

class _PollCardState extends State<PollCard> {
  int? _selectedOptionIndex;

  @override
  Widget build(BuildContext context) {
    final poll = widget.poll;
    final showResults = widget.hasVoted || !poll.isOpen;

    return Card(
      elevation: 0,
      color: context.colors.cardSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: poll.isPinned
            ? const BorderSide(color: AppColors.likudBlue, width: 1.5)
            : BorderSide(color: context.colors.border),
      ),
      child: Padding(
        padding: const EdgeInsetsDirectional.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header: pinned badge + closed badge
            _buildHeader(poll),

            const SizedBox(height: 12),

            // Question
            Text(
              poll.question,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: context.colors.textPrimary,
                height: 1.4,
              ),
            ),

            // Description
            if (poll.description != null && poll.description!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                poll.description!,
                style: TextStyle(
                  fontSize: 14,
                  color: context.colors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Options or results
            if (showResults)
              _buildResults(poll)
            else
              _buildVotingOptions(poll),

            const SizedBox(height: 12),

            // Footer: total votes
            _buildFooter(poll),
          ],
        ),
      ),
    );
  }

  /// Builds the header row with pinned and closed badges.
  Widget _buildHeader(CommunityPoll poll) {
    final badges = <Widget>[];

    if (poll.isPinned) {
      badges.add(
        Container(
          padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 8, 4),
          decoration: BoxDecoration(
            color: AppColors.likudBlue.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.push_pin,
                size: 14,
                color: AppColors.likudBlue,
              ),
              const SizedBox(width: 4),
              Text(
                'polls_pinned'.tr(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.likudBlue,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (!poll.isOpen) {
      if (badges.isNotEmpty) badges.add(const SizedBox(width: 8));
      badges.add(
        Container(
          padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 8, 4),
          decoration: BoxDecoration(
            color: context.colors.textSecondary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.lock_outline,
                size: 14,
                color: context.colors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                'polls_closed'.tr(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (badges.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 4),
      child: Row(children: badges),
    );
  }

  /// Builds the voting options with radio-style selection and a vote button.
  Widget _buildVotingOptions(CommunityPoll poll) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...List.generate(poll.options.length, (index) {
          final option = poll.options[index];
          final isSelected = _selectedOptionIndex == index;

          return Padding(
            padding: EdgeInsetsDirectional.only(
              bottom: index < poll.options.length - 1 ? 8 : 0,
            ),
            child: InkWell(
              onTap: widget.isVoting
                  ? null
                  : () {
                      setState(() {
                        _selectedOptionIndex = index;
                      });
                    },
              borderRadius: BorderRadius.circular(12),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.likudBlue
                        : context.colors.border,
                    width: isSelected ? 2 : 1,
                  ),
                  color: isSelected
                      ? AppColors.likudBlue.withValues(alpha: 0.05)
                      : context.colors.cardSurface,
                ),
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected
                              ? AppColors.likudBlue
                              : context.colors.textSecondary,
                          width: 2,
                        ),
                        color: isSelected
                            ? AppColors.likudBlue
                            : Colors.transparent,
                      ),
                      child: isSelected
                          ? const Icon(
                              Icons.check,
                              size: 14,
                              color: AppColors.white,
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        option.label,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w400,
                          color: context.colors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),

        const SizedBox(height: 16),

        // Vote button
        _buildVoteButton(),
      ],
    );
  }

  /// Builds the vote button (auth guard shown on tap if not logged in).
  Widget _buildVoteButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _selectedOptionIndex != null && !widget.isVoting
            ? () {
                if (!requireAuth(context)) return;
                widget.onVote(_selectedOptionIndex!);
              }
            : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.likudBlue,
          foregroundColor: AppColors.white,
          disabledBackgroundColor: context.colors.border,
          disabledForegroundColor: context.colors.textSecondary,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: widget.isVoting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.white,
                ),
              )
            : Text(
                _selectedOptionIndex != null
                    ? 'polls_vote'.tr()
                    : 'polls_select_option'.tr(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  /// Builds the results view with animated horizontal bars.
  Widget _buildResults(CommunityPoll poll) {
    // Find the winning option index (highest vote count)
    int winningIndex = 0;
    int maxVotes = 0;
    for (int i = 0; i < poll.options.length; i++) {
      if (poll.options[i].voteCount > maxVotes) {
        maxVotes = poll.options[i].voteCount;
        winningIndex = i;
      }
    }

    return Column(
      children: List.generate(poll.options.length, (index) {
        final option = poll.options[index];
        final percentage = poll.percentageFor(index);
        final isWinning = index == winningIndex && poll.totalVotes > 0;
        final isUserVote = widget.votedOptionIndex == index;

        return Padding(
          padding: EdgeInsetsDirectional.only(
            bottom: index < poll.options.length - 1 ? 10 : 0,
          ),
          child: _AnimatedResultBar(
            label: option.label,
            percentage: percentage,
            voteCount: option.voteCount,
            isWinning: isWinning,
            isUserVote: isUserVote,
          ),
        );
      }),
    );
  }

  /// Builds the footer showing total vote count and share button.
  Widget _buildFooter(CommunityPoll poll) {
    return Row(
      children: [
        Icon(
          Icons.people_outline,
          size: 16,
          color: context.colors.textSecondary.withValues(alpha: 0.7),
        ),
        const SizedBox(width: 6),
        Text(
          'polls_total_votes'.tr(args: [poll.totalVotes.toString()]),
          style: TextStyle(
            fontSize: 13,
            color: context.colors.textSecondary.withValues(alpha: 0.7),
          ),
        ),
        if (widget.hasVoted) ...[
          const SizedBox(width: 8),
          Icon(
            Icons.check_circle,
            size: 16,
            color: AppColors.success.withValues(alpha: 0.8),
          ),
          const SizedBox(width: 4),
          Text(
            'polls_voted'.tr(),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.success.withValues(alpha: 0.8),
            ),
          ),
        ],
        const Spacer(),
        WhatsAppShareButton(
          contentType: ShareContentType.poll,
          contentId: poll.id,
          shareText: poll.question,
          title: poll.question,
          description: poll.description,
          size: 36,
          iconSize: 18,
        ),
      ],
    );
  }
}

/// An animated horizontal bar showing a poll option's result.
///
/// Uses [TweenAnimationBuilder] to animate the bar width from 0 to the
/// actual percentage value.
class _AnimatedResultBar extends StatelessWidget {
  final String label;
  final double percentage;
  final int voteCount;
  final bool isWinning;
  final bool isUserVote;

  const _AnimatedResultBar({
    required this.label,
    required this.percentage,
    required this.voteCount,
    this.isWinning = false,
    this.isUserVote = false,
  });

  @override
  Widget build(BuildContext context) {
    final barColor = isWinning
        ? AppColors.likudBlue
        : AppColors.likudBlue.withValues(alpha: 0.4);
    final bgColor = isWinning
        ? AppColors.likudBlue.withValues(alpha: 0.08)
        : context.colors.surfaceVariant;

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: percentage),
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeOutCubic,
      builder: (context, animatedValue, child) {
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: bgColor,
            border: isUserVote
                ? Border.all(color: AppColors.likudBlue, width: 1.5)
                : null,
          ),
          child: Stack(
            children: [
              // Animated fill bar
              FractionallySizedBox(
                widthFactor: animatedValue.clamp(0.0, 1.0),
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: barColor.withValues(alpha: 0.2),
                  ),
                ),
              ),

              // Content overlay
              Container(
                height: 52,
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
                child: Row(
                  children: [
                    // User vote indicator
                    if (isUserVote) ...[
                      const Icon(
                        Icons.check_circle,
                        size: 18,
                        color: AppColors.likudBlue,
                      ),
                      const SizedBox(width: 8),
                    ],

                    // Label
                    Expanded(
                      child: Text(
                        label,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight:
                              isWinning ? FontWeight.w700 : FontWeight.w500,
                          color: context.colors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    const SizedBox(width: 8),

                    // Percentage
                    TweenAnimationBuilder<double>(
                      tween: Tween<double>(
                          begin: 0, end: percentage * 100),
                      duration: const Duration(milliseconds: 800),
                      curve: Curves.easeOutCubic,
                      builder: (context, animatedPercent, _) {
                        return Text(
                          '${animatedPercent.toStringAsFixed(0)}%',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: isWinning
                                ? AppColors.likudBlue
                                : context.colors.textPrimary,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
