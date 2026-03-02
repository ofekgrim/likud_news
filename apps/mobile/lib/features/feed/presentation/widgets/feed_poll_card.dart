import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/feed_item.dart';

/// Card widget for displaying a community poll in the feed
class FeedPollCard extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isPinned ? AppColors.likudBlue : Colors.transparent,
          width: isPinned ? 2 : 0,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
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
                  if (isPinned)
                    Icon(
                      Icons.push_pin,
                      color: AppColors.likudBlue,
                      size: 18,
                    ),
                ],
              ),

              const SizedBox(height: 16),

              // Question
              Text(
                poll.question,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
              ),

              const SizedBox(height: 16),

              // Options (show top 3 or all if less than 3)
              ...poll.options
                  .take(3)
                  .map((option) => _PollOption(
                        option: option,
                        userHasVoted: poll.userHasVoted,
                      ))
                  .toList(),

              if (poll.options.length > 3) ...[
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    '+${poll.options.length - 3} ${'more_options'.tr()}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 16),

              // Footer
              Row(
                children: [
                  // Total votes
                  Icon(Icons.people_outline, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${poll.totalVotes} ${'votes'.tr()}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const Spacer(),

                  // Action button
                  TextButton.icon(
                    onPressed: onTap,
                    icon: Icon(
                      poll.userHasVoted ? Icons.bar_chart : Icons.how_to_vote,
                      size: 18,
                    ),
                    label: Text(
                      poll.userHasVoted
                          ? 'view_results'.tr()
                          : 'vote_now'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.likudBlue,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                  ),
                ],
              ),

              // Expiration info
              if (poll.endsAt != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.timer_outlined, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${'ends'.tr()}: ${_formatDate(poll.endsAt!)}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
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

/// Widget for displaying a single poll option
class _PollOption extends StatelessWidget {
  final FeedPollOption option;
  final bool userHasVoted;

  const _PollOption({
    required this.option,
    required this.userHasVoted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Stack(
        children: [
          // Background progress bar
          if (userHasVoted)
            Container(
              height: 44,
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
                    color: AppColors.likudBlue.withValues(alpha: 0.3),
                  ),
                ),
              ),
            ),

          // Option content
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    option.text,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (userHasVoted) ...[
                  const SizedBox(width: 8),
                  Text(
                    '${option.percentage.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.likudBlue,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
