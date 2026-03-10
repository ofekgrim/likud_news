import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/feed_item.dart';

/// Card widget for displaying an election update in the feed
class FeedElectionCard extends StatelessWidget {
  final FeedElectionContent electionUpdate;
  final bool isPinned;
  final VoidCallback? onTap;

  const FeedElectionCard({
    super.key,
    required this.electionUpdate,
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
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.breakingRed.withValues(alpha: 0.05),
                AppColors.likudBlue.withValues(alpha: 0.05),
              ],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row with LIVE badge
                Row(
                  children: [
                    // LIVE badge with pulse animation
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: electionUpdate.isLive
                            ? AppColors.breakingRed
                            : Colors.grey,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: electionUpdate.isLive
                            ? [
                                BoxShadow(
                                  color: AppColors.breakingRed.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (electionUpdate.isLive)
                            Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(left: 4),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                          const SizedBox(width: 6),
                          Text(
                            electionUpdate.isLive ? 'live'.tr() : 'final'.tr(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        electionUpdate.electionName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isPinned)
                      Icon(
                        Icons.push_pin,
                        color: AppColors.likudBlue,
                        size: 18,
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Turnout info
                if (electionUpdate.turnoutPercentage != null) ...[
                  Row(
                    children: [
                      Icon(
                        Icons.how_to_vote_outlined,
                        size: 20,
                        color: AppColors.likudBlue,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'turnout'.tr(),
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${electionUpdate.turnoutPercentage!.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 20,
                          color: AppColors.likudBlue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  if (electionUpdate.actualVoters != null &&
                      electionUpdate.eligibleVoters != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${electionUpdate.actualVoters!.toString().replaceAllMapped(
                            RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                            (Match m) => '${m[1]},',
                          )} / ${electionUpdate.eligibleVoters!.toString().replaceAllMapped(
                            RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                            (Match m) => '${m[1]},',
                          )} ${'voters'.tr()}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                ],

                // Top candidates
                if (electionUpdate.topCandidates.isNotEmpty) ...[
                  Text(
                    'top_candidates'.tr(),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...electionUpdate.topCandidates
                      .take(3)
                      .map((candidate) => _CandidateBar(candidate: candidate))
                      .toList(),
                ],

                const SizedBox(height: 16),

                // Footer
                Row(
                  children: [
                    // Last updated
                    Icon(Icons.update, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${'updated'.tr()}: ${_formatTime(electionUpdate.lastUpdated)}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),

                    const Spacer(),

                    // View full results button
                    TextButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.leaderboard, size: 18),
                      label: Text(
                        'view_results'.tr(),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.likudBlue,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 1) {
      return 'just_now'.tr();
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} ${'minutes_ago'.tr()}';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} ${'hours_ago'.tr()}';
    } else {
      return DateFormat('HH:mm dd/MM').format(time);
    }
  }
}

/// Widget for displaying a candidate's vote count as a progress bar
class _CandidateBar extends StatelessWidget {
  final FeedCandidateResult candidate;

  const _CandidateBar({required this.candidate});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Candidate name and percentage
          Row(
            children: [
              if (candidate.imageUrl != null) ...[
                CircleAvatar(
                  radius: 14,
                  backgroundImage: NetworkImage(candidate.imageUrl!),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  candidate.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${candidate.percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.likudBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Progress bar
          Stack(
            children: [
              Container(
                height: 8,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  color: Colors.grey[200],
                ),
              ),
              FractionallySizedBox(
                widthFactor: candidate.percentage / 100,
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    gradient: LinearGradient(
                      colors: [
                        AppColors.likudBlue,
                        AppColors.likudBlue.withValues(alpha: 0.7),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Vote count
          Text(
            '${candidate.votesCount.toString().replaceAllMapped(
                  RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                  (Match m) => '${m[1]},',
                )} ${'votes'.tr()}',
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
