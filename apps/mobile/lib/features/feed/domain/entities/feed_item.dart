import 'package:equatable/equatable.dart';

/// Feed item type discriminator
enum FeedItemType {
  article,
  poll,
  event,
  electionUpdate,
  quizPrompt,
  dailyQuiz,
}

/// Base class for all feed items
/// Discriminated union pattern - only one content field will be non-null
abstract class FeedItem extends Equatable {
  final String id;
  final FeedItemType type;
  final DateTime publishedAt;
  final bool isPinned;
  final int sortPriority;

  const FeedItem({
    required this.id,
    required this.type,
    required this.publishedAt,
    required this.isPinned,
    required this.sortPriority,
  });

  @override
  List<Object?> get props => [id, type, publishedAt, isPinned, sortPriority];
}

/// Feed item containing an article
class ArticleFeedItem extends FeedItem {
  final FeedArticleContent article;

  const ArticleFeedItem({
    required super.id,
    required super.publishedAt,
    required super.isPinned,
    required super.sortPriority,
    required this.article,
  }) : super(type: FeedItemType.article);

  @override
  List<Object?> get props => [...super.props, article];
}

/// Feed item containing a community poll
class PollFeedItem extends FeedItem {
  final FeedPollContent poll;

  const PollFeedItem({
    required super.id,
    required super.publishedAt,
    required super.isPinned,
    required super.sortPriority,
    required this.poll,
  }) : super(type: FeedItemType.poll);

  @override
  List<Object?> get props => [...super.props, poll];
}

/// Feed item containing a campaign event
class EventFeedItem extends FeedItem {
  final FeedEventContent event;

  const EventFeedItem({
    required super.id,
    required super.publishedAt,
    required super.isPinned,
    required super.sortPriority,
    required this.event,
  }) : super(type: FeedItemType.event);

  @override
  List<Object?> get props => [...super.props, event];
}

/// Feed item containing an election update
class ElectionUpdateFeedItem extends FeedItem {
  final FeedElectionContent electionUpdate;

  const ElectionUpdateFeedItem({
    required super.id,
    required super.publishedAt,
    required super.isPinned,
    required super.sortPriority,
    required this.electionUpdate,
  }) : super(type: FeedItemType.electionUpdate);

  @override
  List<Object?> get props => [...super.props, electionUpdate];
}

/// Feed item containing a quiz prompt
class QuizPromptFeedItem extends FeedItem {
  final FeedQuizContent quizPrompt;

  const QuizPromptFeedItem({
    required super.id,
    required super.publishedAt,
    required super.isPinned,
    required super.sortPriority,
    required this.quizPrompt,
  }) : super(type: FeedItemType.quizPrompt);

  @override
  List<Object?> get props => [...super.props, quizPrompt];
}

/// Feed item containing a daily quiz
class DailyQuizFeedItem extends FeedItem {
  final FeedDailyQuizContent dailyQuiz;

  const DailyQuizFeedItem({
    required super.id,
    required super.publishedAt,
    required super.isPinned,
    required super.sortPriority,
    required this.dailyQuiz,
  }) : super(type: FeedItemType.dailyQuiz);

  @override
  List<Object?> get props => [...super.props, dailyQuiz];
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT ENTITIES (nested within feed items)
// ═══════════════════════════════════════════════════════════════════

/// Article content within a feed item
class FeedArticleContent extends Equatable {
  final String id;
  final String title;
  final String? titleEn;
  final String? subtitle;
  final String? heroImageUrl;
  final String? categoryName;
  final String? categoryColor;
  final bool isBreaking;
  final int viewCount;
  final int commentCount;
  final int shareCount;
  final int readingTimeMinutes;
  final DateTime publishedAt;
  final String slug;
  final String? author;
  final String? authorEntityName;

  const FeedArticleContent({
    required this.id,
    required this.title,
    this.titleEn,
    this.subtitle,
    this.heroImageUrl,
    this.categoryName,
    this.categoryColor,
    required this.isBreaking,
    required this.viewCount,
    required this.commentCount,
    required this.shareCount,
    required this.readingTimeMinutes,
    required this.publishedAt,
    required this.slug,
    this.author,
    this.authorEntityName,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        titleEn,
        subtitle,
        heroImageUrl,
        categoryName,
        categoryColor,
        isBreaking,
        viewCount,
        commentCount,
        shareCount,
        readingTimeMinutes,
        publishedAt,
        slug,
        author,
        authorEntityName,
      ];
}

/// Poll content within a feed item
class FeedPollContent extends Equatable {
  final String id;
  final String question;
  final String? questionEn;
  final List<FeedPollOption> options;
  final int totalVotes;
  final DateTime? endsAt;
  final bool isActive;
  final bool allowMultipleVotes;
  final bool userHasVoted;
  final int? votedOptionIndex;

  const FeedPollContent({
    required this.id,
    required this.question,
    this.questionEn,
    required this.options,
    required this.totalVotes,
    this.endsAt,
    required this.isActive,
    required this.allowMultipleVotes,
    required this.userHasVoted,
    this.votedOptionIndex,
  });

  @override
  List<Object?> get props => [
        id,
        question,
        questionEn,
        options,
        totalVotes,
        endsAt,
        isActive,
        allowMultipleVotes,
        userHasVoted,
        votedOptionIndex,
      ];
}

/// Poll option
class FeedPollOption extends Equatable {
  final String id;
  final String text;
  final String? textEn;
  final int votesCount;
  final double percentage;

  const FeedPollOption({
    required this.id,
    required this.text,
    this.textEn,
    required this.votesCount,
    required this.percentage,
  });

  @override
  List<Object?> get props => [id, text, textEn, votesCount, percentage];
}

/// Event content within a feed item
class FeedEventContent extends Equatable {
  final String id;
  final String title;
  final String? titleEn;
  final String? description;
  final String? imageUrl;
  final String? location;
  final String? locationEn;
  final DateTime startTime;
  final DateTime? endTime;
  final int rsvpCount;
  final int? maxAttendees;
  final bool userHasRsvped;
  final String? eventType;

  const FeedEventContent({
    required this.id,
    required this.title,
    this.titleEn,
    this.description,
    this.imageUrl,
    this.location,
    this.locationEn,
    required this.startTime,
    this.endTime,
    required this.rsvpCount,
    this.maxAttendees,
    required this.userHasRsvped,
    this.eventType,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        titleEn,
        description,
        imageUrl,
        location,
        locationEn,
        startTime,
        endTime,
        rsvpCount,
        maxAttendees,
        userHasRsvped,
        eventType,
      ];
}

/// Election update content within a feed item
class FeedElectionContent extends Equatable {
  final String id;
  final String electionId;
  final String electionName;
  final String? electionNameEn;
  final double? turnoutPercentage;
  final int? eligibleVoters;
  final int? actualVoters;
  final bool isLive;
  final List<FeedCandidateResult> topCandidates;
  final DateTime lastUpdated;

  const FeedElectionContent({
    required this.id,
    required this.electionId,
    required this.electionName,
    this.electionNameEn,
    this.turnoutPercentage,
    this.eligibleVoters,
    this.actualVoters,
    required this.isLive,
    required this.topCandidates,
    required this.lastUpdated,
  });

  @override
  List<Object?> get props => [
        id,
        electionId,
        electionName,
        electionNameEn,
        turnoutPercentage,
        eligibleVoters,
        actualVoters,
        isLive,
        topCandidates,
        lastUpdated,
      ];
}

/// Candidate result for election updates
class FeedCandidateResult extends Equatable {
  final String id;
  final String name;
  final int votesCount;
  final double percentage;
  final String? imageUrl;

  const FeedCandidateResult({
    required this.id,
    required this.name,
    required this.votesCount,
    required this.percentage,
    this.imageUrl,
  });

  @override
  List<Object?> get props => [id, name, votesCount, percentage, imageUrl];
}

/// Quiz prompt content within a feed item
class FeedQuizContent extends Equatable {
  final String id;
  final String title;
  final String? titleEn;
  final String? description;
  final String? imageUrl;
  final int questionsCount;
  final double? completionRate;
  final bool userHasCompleted;
  final double? userMatchPercentage;

  const FeedQuizContent({
    required this.id,
    required this.title,
    this.titleEn,
    this.description,
    this.imageUrl,
    required this.questionsCount,
    this.completionRate,
    required this.userHasCompleted,
    this.userMatchPercentage,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        titleEn,
        description,
        imageUrl,
        questionsCount,
        completionRate,
        userHasCompleted,
        userMatchPercentage,
      ];
}

/// Daily quiz content within a feed item
class FeedDailyQuizContent extends Equatable {
  final String id;
  final String date;
  final int questionsCount;
  final int pointsReward;
  final bool userHasCompleted;
  final int? userScore;

  const FeedDailyQuizContent({
    required this.id,
    required this.date,
    required this.questionsCount,
    required this.pointsReward,
    required this.userHasCompleted,
    this.userScore,
  });

  @override
  List<Object?> get props => [
        id,
        date,
        questionsCount,
        pointsReward,
        userHasCompleted,
        userScore,
      ];
}
