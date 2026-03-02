import '../../domain/entities/feed_item.dart';

/// Data model for feed items, handles JSON serialization.
///
/// Base model that discriminates between different feed item types
/// and delegates to the appropriate subtype model.
abstract class FeedItemModel {
  /// Factory that creates the correct subtype based on the 'type' field
  factory FeedItemModel.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String;

    switch (type) {
      case 'article':
        return ArticleFeedItemModel.fromJson(json);
      case 'poll':
        return PollFeedItemModel.fromJson(json);
      case 'event':
        return EventFeedItemModel.fromJson(json);
      case 'election_update': // Backend uses snake_case
        return ElectionUpdateFeedItemModel.fromJson(json);
      case 'quiz_prompt': // Backend uses snake_case
        return QuizPromptFeedItemModel.fromJson(json);
      default:
        throw ArgumentError('Unknown feed item type: $type');
    }
  }

  Map<String, dynamic> toJson();
  FeedItem toEntity();
}

/// Model for article feed items
class ArticleFeedItemModel implements FeedItemModel {
  final String id;
  final DateTime publishedAt;
  final bool isPinned;
  final int sortPriority;
  final FeedArticleContentModel article;

  const ArticleFeedItemModel({
    required this.id,
    required this.publishedAt,
    required this.isPinned,
    required this.sortPriority,
    required this.article,
  });

  factory ArticleFeedItemModel.fromJson(Map<String, dynamic> json) {
    return ArticleFeedItemModel(
      id: json['id'] as String,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isPinned: json['isPinned'] as bool? ?? false,
      sortPriority: json['sortPriority'] as int? ?? 0,
      article: FeedArticleContentModel.fromJson(
        json['article'] as Map<String, dynamic>,
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': 'article',
      'publishedAt': publishedAt.toIso8601String(),
      'isPinned': isPinned,
      'sortPriority': sortPriority,
      'article': article.toJson(),
    };
  }

  @override
  ArticleFeedItem toEntity() {
    return ArticleFeedItem(
      id: id,
      publishedAt: publishedAt,
      isPinned: isPinned,
      sortPriority: sortPriority,
      article: article.toEntity(),
    );
  }
}

/// Model for poll feed items
class PollFeedItemModel implements FeedItemModel {
  final String id;
  final DateTime publishedAt;
  final bool isPinned;
  final int sortPriority;
  final FeedPollContentModel poll;

  const PollFeedItemModel({
    required this.id,
    required this.publishedAt,
    required this.isPinned,
    required this.sortPriority,
    required this.poll,
  });

  factory PollFeedItemModel.fromJson(Map<String, dynamic> json) {
    return PollFeedItemModel(
      id: json['id'] as String,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isPinned: json['isPinned'] as bool? ?? false,
      sortPriority: json['sortPriority'] as int? ?? 0,
      poll: FeedPollContentModel.fromJson(
        json['poll'] as Map<String, dynamic>,
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': 'poll',
      'publishedAt': publishedAt.toIso8601String(),
      'isPinned': isPinned,
      'sortPriority': sortPriority,
      'poll': poll.toJson(),
    };
  }

  @override
  PollFeedItem toEntity() {
    return PollFeedItem(
      id: id,
      publishedAt: publishedAt,
      isPinned: isPinned,
      sortPriority: sortPriority,
      poll: poll.toEntity(),
    );
  }
}

/// Model for event feed items
class EventFeedItemModel implements FeedItemModel {
  final String id;
  final DateTime publishedAt;
  final bool isPinned;
  final int sortPriority;
  final FeedEventContentModel event;

  const EventFeedItemModel({
    required this.id,
    required this.publishedAt,
    required this.isPinned,
    required this.sortPriority,
    required this.event,
  });

  factory EventFeedItemModel.fromJson(Map<String, dynamic> json) {
    return EventFeedItemModel(
      id: json['id'] as String,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isPinned: json['isPinned'] as bool? ?? false,
      sortPriority: json['sortPriority'] as int? ?? 0,
      event: FeedEventContentModel.fromJson(
        json['event'] as Map<String, dynamic>,
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': 'event',
      'publishedAt': publishedAt.toIso8601String(),
      'isPinned': isPinned,
      'sortPriority': sortPriority,
      'event': event.toJson(),
    };
  }

  @override
  EventFeedItem toEntity() {
    return EventFeedItem(
      id: id,
      publishedAt: publishedAt,
      isPinned: isPinned,
      sortPriority: sortPriority,
      event: event.toEntity(),
    );
  }
}

/// Model for election update feed items
class ElectionUpdateFeedItemModel implements FeedItemModel {
  final String id;
  final DateTime publishedAt;
  final bool isPinned;
  final int sortPriority;
  final FeedElectionContentModel electionUpdate;

  const ElectionUpdateFeedItemModel({
    required this.id,
    required this.publishedAt,
    required this.isPinned,
    required this.sortPriority,
    required this.electionUpdate,
  });

  factory ElectionUpdateFeedItemModel.fromJson(Map<String, dynamic> json) {
    return ElectionUpdateFeedItemModel(
      id: json['id'] as String,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isPinned: json['isPinned'] as bool? ?? false,
      sortPriority: json['sortPriority'] as int? ?? 0,
      electionUpdate: FeedElectionContentModel.fromJson(
        json['electionUpdate'] as Map<String, dynamic>,
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': 'electionUpdate',
      'publishedAt': publishedAt.toIso8601String(),
      'isPinned': isPinned,
      'sortPriority': sortPriority,
      'electionUpdate': electionUpdate.toJson(),
    };
  }

  @override
  ElectionUpdateFeedItem toEntity() {
    return ElectionUpdateFeedItem(
      id: id,
      publishedAt: publishedAt,
      isPinned: isPinned,
      sortPriority: sortPriority,
      electionUpdate: electionUpdate.toEntity(),
    );
  }
}

/// Model for quiz prompt feed items
class QuizPromptFeedItemModel implements FeedItemModel {
  final String id;
  final DateTime publishedAt;
  final bool isPinned;
  final int sortPriority;
  final FeedQuizContentModel quizPrompt;

  const QuizPromptFeedItemModel({
    required this.id,
    required this.publishedAt,
    required this.isPinned,
    required this.sortPriority,
    required this.quizPrompt,
  });

  factory QuizPromptFeedItemModel.fromJson(Map<String, dynamic> json) {
    return QuizPromptFeedItemModel(
      id: json['id'] as String,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isPinned: json['isPinned'] as bool? ?? false,
      sortPriority: json['sortPriority'] as int? ?? 0,
      quizPrompt: FeedQuizContentModel.fromJson(
        json['quizPrompt'] as Map<String, dynamic>,
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': 'quizPrompt',
      'publishedAt': publishedAt.toIso8601String(),
      'isPinned': isPinned,
      'sortPriority': sortPriority,
      'quizPrompt': quizPrompt.toJson(),
    };
  }

  @override
  QuizPromptFeedItem toEntity() {
    return QuizPromptFeedItem(
      id: id,
      publishedAt: publishedAt,
      isPinned: isPinned,
      sortPriority: sortPriority,
      quizPrompt: quizPrompt.toEntity(),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT MODELS (nested within feed items)
// ═══════════════════════════════════════════════════════════════════

/// Model for article content within a feed item
class FeedArticleContentModel {
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

  const FeedArticleContentModel({
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

  factory FeedArticleContentModel.fromJson(Map<String, dynamic> json) {
    return FeedArticleContentModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      titleEn: json['titleEn'] as String?,
      subtitle: json['subtitle'] as String?,
      heroImageUrl: json['heroImageUrl'] as String?,
      categoryName: json['categoryName'] as String?,
      categoryColor: json['categoryColor'] as String?,
      isBreaking: json['isBreaking'] as bool? ?? false,
      viewCount: json['viewCount'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? 0,
      shareCount: json['shareCount'] as int? ?? 0,
      readingTimeMinutes: json['readingTimeMinutes'] as int? ?? 0,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'] as String)
          : DateTime.now(),
      slug: json['slug'] as String? ?? '',
      author: json['author'] as String?,
      authorEntityName: json['authorEntityName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleEn': titleEn,
      'subtitle': subtitle,
      'heroImageUrl': heroImageUrl,
      'categoryName': categoryName,
      'categoryColor': categoryColor,
      'isBreaking': isBreaking,
      'viewCount': viewCount,
      'commentCount': commentCount,
      'shareCount': shareCount,
      'readingTimeMinutes': readingTimeMinutes,
      'publishedAt': publishedAt.toIso8601String(),
      'slug': slug,
      'author': author,
      'authorEntityName': authorEntityName,
    };
  }

  FeedArticleContent toEntity() {
    return FeedArticleContent(
      id: id,
      title: title,
      titleEn: titleEn,
      subtitle: subtitle,
      heroImageUrl: heroImageUrl,
      categoryName: categoryName,
      categoryColor: categoryColor,
      isBreaking: isBreaking,
      viewCount: viewCount,
      commentCount: commentCount,
      shareCount: shareCount,
      readingTimeMinutes: readingTimeMinutes,
      publishedAt: publishedAt,
      slug: slug,
      author: author,
      authorEntityName: authorEntityName,
    );
  }
}

/// Model for poll content within a feed item
class FeedPollContentModel {
  final String id;
  final String question;
  final String? questionEn;
  final List<FeedPollOptionModel> options;
  final int totalVotes;
  final DateTime? endsAt;
  final bool isActive;
  final bool allowMultipleVotes;
  final bool userHasVoted;

  const FeedPollContentModel({
    required this.id,
    required this.question,
    this.questionEn,
    required this.options,
    required this.totalVotes,
    this.endsAt,
    required this.isActive,
    required this.allowMultipleVotes,
    required this.userHasVoted,
  });

  factory FeedPollContentModel.fromJson(Map<String, dynamic> json) {
    return FeedPollContentModel(
      id: json['id'] as String,
      question: json['question'] as String? ?? '',
      questionEn: json['questionEn'] as String?,
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => FeedPollOptionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      totalVotes: json['totalVotes'] as int? ?? 0,
      endsAt: json['endsAt'] != null
          ? DateTime.parse(json['endsAt'] as String)
          : null,
      isActive: json['isActive'] as bool? ?? true,
      allowMultipleVotes: json['allowMultipleVotes'] as bool? ?? false,
      userHasVoted: json['userHasVoted'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question': question,
      'questionEn': questionEn,
      'options': options.map((e) => e.toJson()).toList(),
      'totalVotes': totalVotes,
      'endsAt': endsAt?.toIso8601String(),
      'isActive': isActive,
      'allowMultipleVotes': allowMultipleVotes,
      'userHasVoted': userHasVoted,
    };
  }

  FeedPollContent toEntity() {
    return FeedPollContent(
      id: id,
      question: question,
      questionEn: questionEn,
      options: options.map((e) => e.toEntity()).toList(),
      totalVotes: totalVotes,
      endsAt: endsAt,
      isActive: isActive,
      allowMultipleVotes: allowMultipleVotes,
      userHasVoted: userHasVoted,
    );
  }
}

/// Model for poll option
class FeedPollOptionModel {
  final String id;
  final String text;
  final String? textEn;
  final int votesCount;
  final double percentage;

  const FeedPollOptionModel({
    required this.id,
    required this.text,
    this.textEn,
    required this.votesCount,
    required this.percentage,
  });

  factory FeedPollOptionModel.fromJson(Map<String, dynamic> json) {
    return FeedPollOptionModel(
      id: json['id'] as String,
      text: json['text'] as String? ?? '',
      textEn: json['textEn'] as String?,
      votesCount: json['votesCount'] as int? ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'textEn': textEn,
      'votesCount': votesCount,
      'percentage': percentage,
    };
  }

  FeedPollOption toEntity() {
    return FeedPollOption(
      id: id,
      text: text,
      textEn: textEn,
      votesCount: votesCount,
      percentage: percentage,
    );
  }
}

/// Model for event content within a feed item
class FeedEventContentModel {
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

  const FeedEventContentModel({
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

  factory FeedEventContentModel.fromJson(Map<String, dynamic> json) {
    return FeedEventContentModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      titleEn: json['titleEn'] as String?,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      location: json['location'] as String?,
      locationEn: json['locationEn'] as String?,
      startTime: json['startTime'] != null
          ? DateTime.parse(json['startTime'] as String)
          : DateTime.now(),
      endTime: json['endTime'] != null
          ? DateTime.parse(json['endTime'] as String)
          : null,
      rsvpCount: json['rsvpCount'] as int? ?? 0,
      maxAttendees: json['maxAttendees'] as int?,
      userHasRsvped: json['userHasRsvped'] as bool? ?? false,
      eventType: json['eventType'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleEn': titleEn,
      'description': description,
      'imageUrl': imageUrl,
      'location': location,
      'locationEn': locationEn,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'rsvpCount': rsvpCount,
      'maxAttendees': maxAttendees,
      'userHasRsvped': userHasRsvped,
      'eventType': eventType,
    };
  }

  FeedEventContent toEntity() {
    return FeedEventContent(
      id: id,
      title: title,
      titleEn: titleEn,
      description: description,
      imageUrl: imageUrl,
      location: location,
      locationEn: locationEn,
      startTime: startTime,
      endTime: endTime,
      rsvpCount: rsvpCount,
      maxAttendees: maxAttendees,
      userHasRsvped: userHasRsvped,
      eventType: eventType,
    );
  }
}

/// Model for election update content within a feed item
class FeedElectionContentModel {
  final String id;
  final String electionId;
  final String electionName;
  final String? electionNameEn;
  final double? turnoutPercentage;
  final int? eligibleVoters;
  final int? actualVoters;
  final bool isLive;
  final List<FeedCandidateResultModel> topCandidates;
  final DateTime lastUpdated;

  const FeedElectionContentModel({
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

  factory FeedElectionContentModel.fromJson(Map<String, dynamic> json) {
    return FeedElectionContentModel(
      id: json['id'] as String,
      electionId: json['electionId'] as String? ?? '',
      electionName: json['electionName'] as String? ?? '',
      electionNameEn: json['electionNameEn'] as String?,
      turnoutPercentage: (json['turnoutPercentage'] as num?)?.toDouble(),
      eligibleVoters: json['eligibleVoters'] as int?,
      actualVoters: json['actualVoters'] as int?,
      isLive: json['isLive'] as bool? ?? false,
      topCandidates: (json['topCandidates'] as List<dynamic>?)
              ?.map((e) => FeedCandidateResultModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'electionId': electionId,
      'electionName': electionName,
      'electionNameEn': electionNameEn,
      'turnoutPercentage': turnoutPercentage,
      'eligibleVoters': eligibleVoters,
      'actualVoters': actualVoters,
      'isLive': isLive,
      'topCandidates': topCandidates.map((e) => e.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  FeedElectionContent toEntity() {
    return FeedElectionContent(
      id: id,
      electionId: electionId,
      electionName: electionName,
      electionNameEn: electionNameEn,
      turnoutPercentage: turnoutPercentage,
      eligibleVoters: eligibleVoters,
      actualVoters: actualVoters,
      isLive: isLive,
      topCandidates: topCandidates.map((e) => e.toEntity()).toList(),
      lastUpdated: lastUpdated,
    );
  }
}

/// Model for candidate result
class FeedCandidateResultModel {
  final String id;
  final String name;
  final int votesCount;
  final double percentage;
  final String? imageUrl;

  const FeedCandidateResultModel({
    required this.id,
    required this.name,
    required this.votesCount,
    required this.percentage,
    this.imageUrl,
  });

  factory FeedCandidateResultModel.fromJson(Map<String, dynamic> json) {
    return FeedCandidateResultModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      votesCount: json['votesCount'] as int? ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'votesCount': votesCount,
      'percentage': percentage,
      'imageUrl': imageUrl,
    };
  }

  FeedCandidateResult toEntity() {
    return FeedCandidateResult(
      id: id,
      name: name,
      votesCount: votesCount,
      percentage: percentage,
      imageUrl: imageUrl,
    );
  }
}

/// Model for quiz prompt content within a feed item
class FeedQuizContentModel {
  final String id;
  final String title;
  final String? titleEn;
  final String? description;
  final String? imageUrl;
  final int questionsCount;
  final double? completionRate;
  final bool userHasCompleted;
  final double? userMatchPercentage;

  const FeedQuizContentModel({
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

  factory FeedQuizContentModel.fromJson(Map<String, dynamic> json) {
    return FeedQuizContentModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      titleEn: json['titleEn'] as String?,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      questionsCount: json['questionsCount'] as int? ?? 0,
      completionRate: (json['completionRate'] as num?)?.toDouble(),
      userHasCompleted: json['userHasCompleted'] as bool? ?? false,
      userMatchPercentage: (json['userMatchPercentage'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleEn': titleEn,
      'description': description,
      'imageUrl': imageUrl,
      'questionsCount': questionsCount,
      'completionRate': completionRate,
      'userHasCompleted': userHasCompleted,
      'userMatchPercentage': userMatchPercentage,
    };
  }

  FeedQuizContent toEntity() {
    return FeedQuizContent(
      id: id,
      title: title,
      titleEn: titleEn,
      description: description,
      imageUrl: imageUrl,
      questionsCount: questionsCount,
      completionRate: completionRate,
      userHasCompleted: userHasCompleted,
      userMatchPercentage: userMatchPercentage,
    );
  }
}
