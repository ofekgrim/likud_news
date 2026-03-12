import 'package:flutter/material.dart';
import '../../domain/entities/feed_item.dart';
import 'feed_article_card.dart';
import 'feed_poll_card.dart';
import 'feed_event_card.dart';
import 'feed_election_card.dart';
import 'feed_quiz_prompt_card.dart';
import 'feed_daily_quiz_card.dart';
import 'sponsored_feed_card.dart';
import 'sponsored_candidate_ad_card.dart';

/// Polymorphic widget that renders the appropriate card based on feed item type
class FeedItemCard extends StatelessWidget {
  final FeedItem feedItem;
  final VoidCallback? onTap;

  const FeedItemCard({super.key, required this.feedItem, this.onTap});

  @override
  Widget build(BuildContext context) {
    // Dispatch to the appropriate card widget based on type
    return switch (feedItem) {
      ArticleFeedItem item => FeedArticleCard(
        article: item.article,
        isPinned: item.isPinned,
        onTap: onTap,
      ),
      PollFeedItem item => FeedPollCard(
        poll: item.poll,
        isPinned: item.isPinned,
        onTap: onTap,
      ),
      EventFeedItem item => FeedEventCard(
        event: item.event,
        isPinned: item.isPinned,
        onTap: onTap,
      ),
      ElectionUpdateFeedItem item => FeedElectionCard(
        electionUpdate: item.electionUpdate,
        isPinned: item.isPinned,
        onTap: onTap,
      ),
      QuizPromptFeedItem item => FeedQuizPromptCard(
        quizPrompt: item.quizPrompt,
        isPinned: item.isPinned,
        onTap: onTap,
      ),
      DailyQuizFeedItem item => FeedDailyQuizCard(
        dailyQuiz: item.dailyQuiz,
        isPinned: item.isPinned,
        onTap: onTap,
      ),
      CompanyAdFeedItem item => SponsoredFeedCard(
        companyAd: item.companyAd,
      ),
      CandidateAdFeedItem item => SponsoredCandidateAdCard(
        candidateAd: item.candidateAd,
        onTap: onTap,
      ),
      _ => const SizedBox.shrink(),
    };
  }
}
