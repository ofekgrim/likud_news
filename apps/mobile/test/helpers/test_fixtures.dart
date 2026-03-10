import 'package:metzudat_halikud/features/article_detail/domain/entities/article_detail.dart';
import 'package:metzudat_halikud/features/feed/domain/entities/feed_item.dart';
import 'package:metzudat_halikud/features/feed/domain/entities/feed_response.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member_detail.dart';
import 'package:metzudat_halikud/features/search/domain/entities/search_result.dart';
import 'package:metzudat_halikud/features/video/domain/entities/video_article.dart';

/// Creates a test [Article] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Article createTestArticle({
  String id = '1',
  String title = 'Test Article',
  String? titleEn = 'Test Article EN',
  String? subtitle = 'Test subtitle',
  String? content = '<p>Test article content</p>',
  String? heroImageUrl = 'https://example.com/image.jpg',
  String? heroImageCaption = 'Test caption',
  String? author = 'Test Author',
  List<String> hashtags = const [],
  bool isHero = false,
  bool isBreaking = false,
  int viewCount = 0,
  String? slug = 'test-article',
  DateTime? publishedAt,
  String? categoryId = '1',
  String? categoryName = 'Test Category',
  String? categoryColor = '#0099DB',
}) {
  return Article(
    id: id,
    title: title,
    titleEn: titleEn,
    subtitle: subtitle,
    content: content,
    heroImageUrl: heroImageUrl,
    heroImageCaption: heroImageCaption,
    author: author,
    hashtags: hashtags,
    isHero: isHero,
    isBreaking: isBreaking,
    viewCount: viewCount,
    slug: slug,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    categoryId: categoryId,
    categoryName: categoryName,
    categoryColor: categoryColor,
  );
}

/// Creates a list of [count] test articles with sequential IDs and titles.
List<Article> createTestArticleList(int count) {
  return List.generate(
    count,
    (index) => createTestArticle(
      id: '${index + 1}',
      title: 'Test Article ${index + 1}',
      slug: 'test-article-${index + 1}',
    ),
  );
}

/// Creates a test [Category] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Category createTestCategory({
  String id = '1',
  String name = 'Test Category',
  String? nameEn = 'Test Category EN',
  String? slug = 'test-category',
  String? iconUrl = 'https://example.com/icon.svg',
  int sortOrder = 0,
  bool isActive = true,
  String? color = '#0099DB',
}) {
  return Category(
    id: id,
    name: name,
    nameEn: nameEn,
    slug: slug,
    iconUrl: iconUrl,
    sortOrder: sortOrder,
    isActive: isActive,
    color: color,
  );
}

/// Creates a test [TickerItem] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
TickerItem createTestTickerItem({
  String id = '1',
  String text = 'Test ticker headline',
  String? linkUrl = 'https://example.com/article',
  String? articleId = '1',
  int position = 0,
  bool isActive = true,
}) {
  return TickerItem(
    id: id,
    text: text,
    linkUrl: linkUrl,
    articleId: articleId,
    position: position,
    isActive: isActive,
  );
}

/// Creates a test [ArticleDetail] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
ArticleDetail createTestArticleDetail({
  String id = '1',
  String title = 'Test Article Detail',
  String? titleEn = 'Test Article Detail EN',
  String? subtitle = 'Test subtitle',
  String? content = '<p>Test content</p>',
  String? contentEn = '<p>Test content EN</p>',
  String? heroImageUrl = 'https://example.com/image.jpg',
  String? heroImageCaption = 'Test caption',
  String? author = 'Test Author',
  List<String> hashtags = const [],
  bool isHero = false,
  bool isBreaking = false,
  int viewCount = 0,
  String? slug = 'test-article-detail',
  DateTime? publishedAt,
  String? categoryId = '1',
  String? categoryName = 'Test Category',
  String? categoryColor = '#0099DB',
  List<Article> relatedArticles = const [],
  bool isFavorite = false,
}) {
  return ArticleDetail(
    id: id,
    title: title,
    titleEn: titleEn,
    subtitle: subtitle,
    content: content,
    contentEn: contentEn,
    heroImageUrl: heroImageUrl,
    heroImageCaption: heroImageCaption,
    author: author,
    hashtags: hashtags,
    isHero: isHero,
    isBreaking: isBreaking,
    viewCount: viewCount,
    slug: slug,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    categoryId: categoryId,
    categoryName: categoryName,
    categoryColor: categoryColor,
    relatedArticles: relatedArticles,
    isFavorite: isFavorite,
  );
}

/// Creates a test [SearchResult] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
SearchResult createTestSearchResult({
  List<Article>? articles,
  int totalArticles = 3,
}) {
  return SearchResult(
    articles: articles ?? createTestArticleList(3),
    totalArticles: totalArticles,
  );
}

/// Creates a test [Member] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Member createTestMember({
  String id = '1',
  String name = 'Test Member',
  String? nameEn = 'Test Member EN',
  String? title = 'Member of Knesset',
  String? bio = 'Test bio for member',
  String? photoUrl = 'https://example.com/photo.jpg',
  String? socialTwitter,
  String? socialFacebook,
  String? socialInstagram,
  bool isActive = true,
  int sortOrder = 0,
}) {
  return Member(
    id: id,
    name: name,
    nameEn: nameEn,
    title: title,
    bio: bio,
    photoUrl: photoUrl,
    socialTwitter: socialTwitter,
    socialFacebook: socialFacebook,
    socialInstagram: socialInstagram,
    isActive: isActive,
    sortOrder: sortOrder,
  );
}

/// Creates a test [MemberDetail] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
MemberDetail createTestMemberDetail({
  Member? member,
  List<Article> articles = const [],
}) {
  return MemberDetail(
    member: member ?? createTestMember(),
    articles: articles,
  );
}

/// Creates a test [VideoArticle] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
VideoArticle createTestVideoArticle({
  String id = '1',
  String title = 'Test Video',
  String? subtitle = 'Test video subtitle',
  String? heroImageUrl = 'https://example.com/thumb.jpg',
  String? videoUrl = 'https://example.com/video.mp4',
  int duration = 120,
  String? categoryName = 'Video Category',
  String? categoryColor = '#0099DB',
  String? slug = 'test-video',
  DateTime? publishedAt,
}) {
  return VideoArticle(
    id: id,
    title: title,
    subtitle: subtitle,
    heroImageUrl: heroImageUrl,
    videoUrl: videoUrl,
    duration: duration,
    categoryName: categoryName,
    categoryColor: categoryColor,
    slug: slug,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
  );
}

// ═══════════════════════════════════════════════════════════════════
// FEED ITEM FIXTURES
// ═══════════════════════════════════════════════════════════════════

FeedMeta createTestFeedMeta({
  int page = 1,
  int limit = 20,
  int total = 10,
  int totalPages = 1,
  int articlesCount = 5,
  int pollsCount = 2,
  int eventsCount = 1,
  int electionsCount = 1,
  int quizzesCount = 1,
}) {
  return FeedMeta(
    page: page,
    limit: limit,
    total: total,
    totalPages: totalPages,
    articlesCount: articlesCount,
    pollsCount: pollsCount,
    eventsCount: eventsCount,
    electionsCount: electionsCount,
    quizzesCount: quizzesCount,
  );
}

FeedArticleContent createTestFeedArticleContent({
  String id = 'fa-1',
  String title = 'Test Feed Article',
  String? titleEn = 'Test Feed Article EN',
  String? subtitle = 'Test feed subtitle',
  String? heroImageUrl = 'https://example.com/image.jpg',
  String? categoryName = 'Test Category',
  String? categoryColor = '#0099DB',
  bool isBreaking = false,
  int viewCount = 150,
  int commentCount = 5,
  int shareCount = 10,
  int readingTimeMinutes = 3,
  DateTime? publishedAt,
  String slug = 'test-feed-article',
  String? author = 'Test Author',
  String? authorEntityName,
}) {
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
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    slug: slug,
    author: author,
    authorEntityName: authorEntityName,
  );
}

ArticleFeedItem createTestArticleFeedItem({
  String id = 'fi-article-1',
  DateTime? publishedAt,
  bool isPinned = false,
  int sortPriority = 0,
  FeedArticleContent? article,
}) {
  return ArticleFeedItem(
    id: id,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    isPinned: isPinned,
    sortPriority: sortPriority,
    article: article ?? createTestFeedArticleContent(),
  );
}

FeedPollOption createTestFeedPollOption({
  String id = 'opt-1',
  String text = 'Option 1',
  String? textEn,
  int votesCount = 50,
  double percentage = 50.0,
}) {
  return FeedPollOption(
    id: id,
    text: text,
    textEn: textEn,
    votesCount: votesCount,
    percentage: percentage,
  );
}

FeedPollContent createTestFeedPollContent({
  String id = 'fp-1',
  String question = 'Test Poll Question?',
  String? questionEn,
  List<FeedPollOption>? options,
  int totalVotes = 100,
  DateTime? endsAt,
  bool isActive = true,
  bool allowMultipleVotes = false,
  bool userHasVoted = false,
  int? votedOptionIndex,
}) {
  return FeedPollContent(
    id: id,
    question: question,
    questionEn: questionEn,
    options: options ??
        [
          createTestFeedPollOption(id: 'opt-1', text: 'Option A', votesCount: 60, percentage: 60.0),
          createTestFeedPollOption(id: 'opt-2', text: 'Option B', votesCount: 40, percentage: 40.0),
        ],
    totalVotes: totalVotes,
    endsAt: endsAt,
    isActive: isActive,
    allowMultipleVotes: allowMultipleVotes,
    userHasVoted: userHasVoted,
    votedOptionIndex: votedOptionIndex,
  );
}

PollFeedItem createTestPollFeedItem({
  String id = 'fi-poll-1',
  DateTime? publishedAt,
  bool isPinned = false,
  int sortPriority = 0,
  FeedPollContent? poll,
}) {
  return PollFeedItem(
    id: id,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    isPinned: isPinned,
    sortPriority: sortPriority,
    poll: poll ?? createTestFeedPollContent(),
  );
}

FeedEventContent createTestFeedEventContent({
  String id = 'fe-1',
  String title = 'Test Event',
  String? titleEn,
  String? description = 'Test event description',
  String? imageUrl,
  String? location = 'Tel Aviv',
  String? locationEn,
  DateTime? startTime,
  DateTime? endTime,
  int rsvpCount = 25,
  int? maxAttendees = 100,
  bool userHasRsvped = false,
  String? eventType = 'rally',
}) {
  return FeedEventContent(
    id: id,
    title: title,
    titleEn: titleEn,
    description: description,
    imageUrl: imageUrl,
    location: location,
    locationEn: locationEn,
    startTime: startTime ?? DateTime(2024, 3, 1, 18, 0),
    endTime: endTime,
    rsvpCount: rsvpCount,
    maxAttendees: maxAttendees,
    userHasRsvped: userHasRsvped,
    eventType: eventType,
  );
}

EventFeedItem createTestEventFeedItem({
  String id = 'fi-event-1',
  DateTime? publishedAt,
  bool isPinned = false,
  int sortPriority = 0,
  FeedEventContent? event,
}) {
  return EventFeedItem(
    id: id,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    isPinned: isPinned,
    sortPriority: sortPriority,
    event: event ?? createTestFeedEventContent(),
  );
}

FeedElectionContent createTestFeedElectionContent({
  String id = 'fel-1',
  String electionId = 'el-1',
  String electionName = 'פריימריז הליכוד 2026',
  String? electionNameEn,
  double? turnoutPercentage = 67.5,
  int? eligibleVoters = 125000,
  int? actualVoters = 84375,
  bool isLive = true,
  List<FeedCandidateResult>? topCandidates,
  DateTime? lastUpdated,
}) {
  return FeedElectionContent(
    id: id,
    electionId: electionId,
    electionName: electionName,
    electionNameEn: electionNameEn,
    turnoutPercentage: turnoutPercentage,
    eligibleVoters: eligibleVoters,
    actualVoters: actualVoters,
    isLive: isLive,
    topCandidates: topCandidates ??
        [
          const FeedCandidateResult(id: 'c1', name: 'דוד כהן', votesCount: 15000, percentage: 35.5),
          const FeedCandidateResult(id: 'c2', name: 'שרה לוי', votesCount: 12000, percentage: 28.4),
          const FeedCandidateResult(id: 'c3', name: 'משה אברהם', votesCount: 8000, percentage: 18.9),
        ],
    lastUpdated: lastUpdated ?? DateTime(2024, 1, 15, 14, 30),
  );
}

ElectionUpdateFeedItem createTestElectionFeedItem({
  String id = 'fi-election-1',
  DateTime? publishedAt,
  bool isPinned = false,
  int sortPriority = 0,
  FeedElectionContent? electionUpdate,
}) {
  return ElectionUpdateFeedItem(
    id: id,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    isPinned: isPinned,
    sortPriority: sortPriority,
    electionUpdate: electionUpdate ?? createTestFeedElectionContent(),
  );
}

FeedQuizContent createTestFeedQuizContent({
  String id = 'fq-1',
  String title = 'Test Quiz',
  String? titleEn,
  String? description = 'Find your best match',
  String? imageUrl,
  int questionsCount = 10,
  double? completionRate = 45.0,
  bool userHasCompleted = false,
  double? userMatchPercentage,
}) {
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

QuizPromptFeedItem createTestQuizFeedItem({
  String id = 'fi-quiz-1',
  DateTime? publishedAt,
  bool isPinned = false,
  int sortPriority = 0,
  FeedQuizContent? quizPrompt,
}) {
  return QuizPromptFeedItem(
    id: id,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    isPinned: isPinned,
    sortPriority: sortPriority,
    quizPrompt: quizPrompt ?? createTestFeedQuizContent(),
  );
}
