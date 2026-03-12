export interface Article {
  id: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  content: string;
  contentEn?: string;
  heroImageUrl?: string;
  heroImageCaption?: string;
  author?: string;
  hashtags?: string;
  status: 'draft' | 'published' | 'archived';
  isHero: boolean;
  isBreaking: boolean;
  isMain?: boolean;
  viewCount: number;
  commentCount?: number;
  slug: string;
  publishedAt?: string;
  categoryId?: string;
  category?: Category;
  members?: Member[];
  createdAt: string;
  updatedAt: string;
  bodyBlocks?: ContentBlock[];
  alertBannerText?: string;
  alertBannerEnabled?: boolean;
  alertBannerColor?: string;
  heroImageCredit?: string;
  heroImageCaptionHe?: string;
  heroImageFullUrl?: string;
  authorId?: string;
  authorEntity?: Author;
  tagIds?: string[];
  tags?: Tag[];
  allowComments?: boolean;
  readingTimeMinutes?: number;
  shareCount?: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
  color?: string;
}

export interface Member {
  id: string;
  name: string;
  nameEn?: string;
  title?: string;
  titleEn?: string;
  bio?: string;
  bioEn?: string;
  bioBlocks?: ContentBlock[];
  photoUrl?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  slug?: string;
  office?: string;
  phone?: string;
  email?: string;
  website?: string;
  coverImageUrl?: string;
  personalPageHtml?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TickerItem {
  id: string;
  text: string;
  linkUrl?: string;
  articleId?: string;
  position: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'editor';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  s3Key: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  altText?: string;
  articleId?: string;
  createdAt: string;
}

export interface PresignResponse {
  uploadUrl: string;
  s3Key: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Authors ──────────────────────────────────────────────────────────────

export interface Author {
  id: string;
  nameHe: string;
  nameEn?: string;
  roleHe?: string;
  roleEn?: string;
  bioHe?: string;
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
  email?: string;
  socialLinks?: Record<string, string>;
  userId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Tags ─────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  nameHe: string;
  nameEn?: string;
  slug: string;
  tagType: 'topic' | 'person' | 'location';
  createdAt: string;
}

// ── Comments ─────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  articleId: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
  body: string;
  isApproved: boolean;
  isPinned: boolean;
  likesCount: number;
  createdAt: string;
  replies?: Comment[];
  article?: { id: string; title: string; slug: string };
}

// ── Stories ──────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationSeconds: number;
  mediaType: 'image' | 'video';
  linkUrl?: string;
  articleId?: string;
  linkedArticleId?: string;
  article?: { id: string; title: string; slug: string };
  linkedArticle?: { id: string; title: string; slug: string };
  sortOrder: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Content Block Types (Block Editor) ───────────────────────────────────

export type ContentBlockType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'youtube'
  | 'tweet'
  | 'instagram'
  | 'facebook'
  | 'quote'
  | 'divider'
  | 'bullet_list'
  | 'article_link'
  | 'video';

export interface BaseBlock {
  id: string;
  type: ContentBlockType;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  text: string;
  level: 2 | 3 | 4;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  fullUrl?: string;
  credit?: string;
  captionHe?: string;
  captionEn?: string;
  altText?: string;
}

export interface YouTubeBlock extends BaseBlock {
  type: 'youtube';
  videoId: string;
  caption?: string;
  credit?: string;
}

export interface TweetBlock extends BaseBlock {
  type: 'tweet';
  tweetId: string;
  authorHandle?: string;
  previewText?: string;
  caption?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface BulletListBlock extends BaseBlock {
  type: 'bullet_list';
  items: string[];
}

export interface ArticleLinkBlock extends BaseBlock {
  type: 'article_link';
  linkedArticleId: string;
  displayStyle: 'card' | 'inline';
  linkedArticle?: { title: string; heroImageUrl?: string; slug: string };
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  source: 'youtube' | 'upload';
  videoId?: string;
  url?: string;
  thumbnailUrl?: string;
  caption?: string;
  credit?: string;
  mimeType?: string;
}

export interface InstagramBlock extends BaseBlock {
  type: 'instagram';
  postUrl: string;
  caption?: string;
}

export interface FacebookBlock extends BaseBlock {
  type: 'facebook';
  postUrl: string;
  caption?: string;
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | YouTubeBlock
  | TweetBlock
  | InstagramBlock
  | FacebookBlock
  | QuoteBlock
  | DividerBlock
  | BulletListBlock
  | ArticleLinkBlock
  | VideoBlock;

// ── App Users (Mobile App) ──────────────────────────────────────────────

export interface AppUser {
  id: string;
  phone?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'guest' | 'member' | 'verified_member';
  membershipId?: string;
  membershipStatus: 'unverified' | 'pending' | 'verified' | 'expired';
  membershipVerifiedAt?: string;
  preferredCategories: string[];
  notificationPrefs: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  votingEligibility?: VotingEligibility[];
}

export interface VotingEligibility {
  id: string;
  userId: string;
  electionId: string;
  approvedBy?: string;
  approvedAt: string;
  election?: PrimaryElection;
}

export interface AppUsersResponse {
  data: AppUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Primaries: Elections ─────────────────────────────────────────────────

export interface PrimaryElection {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  electionDate: string;
  registrationDeadline?: string;
  status: 'draft' | 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Primaries: Candidates ────────────────────────────────────────────────

export interface PrimaryCandidate {
  id: string;
  fullName: string;
  slug: string;
  district?: string;
  position?: string;
  photoUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  bioBlocks?: ContentBlock[];
  socialLinks?: Record<string, string>;
  phone?: string;
  email?: string;
  website?: string;
  quizPositions?: Record<string, number>;
  endorsementCount: number;
  isActive: boolean;
  electionId: string;
  election?: PrimaryElection;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Primaries: Endorsements ──────────────────────────────────────────────

export interface CandidateEndorsement {
  id: string;
  userId: string;
  candidateId: string;
  electionId: string;
  candidate?: PrimaryCandidate;
  user?: { displayName?: string; phone?: string };
  createdAt: string;
}

// ── Primaries: Quiz ──────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  electionId: string;
  questionText: string;
  questionTextEn?: string;
  options: { value: number; label: string; labelEn?: string }[];
  importanceLevel: 'low' | 'medium' | 'high';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuizResponse {
  id: string;
  userId: string;
  electionId: string;
  answers: { questionId: string; selectedValue: number; importance: number }[];
  matchResults: { candidateId: string; candidateName: string; matchPercentage: number }[];
  completedAt: string;
  user?: { id: string; displayName?: string; phone?: string; email?: string; avatarUrl?: string };
}

// ── Primaries: Polling Stations ──────────────────────────────────────────

export interface PollingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  isAccessible: boolean;
  openTime?: string;
  closeTime?: string;
  electionId: string;
  isActive: boolean;
  createdAt: string;
}

// ── Primaries: Election Results ──────────────────────────────────────────

export interface ElectionResult {
  id: string;
  candidateId: string;
  stationId?: string;
  electionId: string;
  voteCount: number;
  isOfficial: boolean;
  candidate?: PrimaryCandidate;
  station?: PollingStation;
  createdAt: string;
}

export interface TurnoutSnapshot {
  id: string;
  electionId: string;
  district?: string;
  eligibleVoters: number;
  actualVoters: number;
  percentage: number;
  snapshotAt: string;
}

// ── Primaries: Community Polls ───────────────────────────────────────────

export interface CommunityPoll {
  id: string;
  question: string;
  questionEn?: string;
  options: { id: string; text: string; textEn?: string; voteCount: number }[];
  totalVotes: number;
  isPinned: boolean;
  isActive: boolean;
  closesAt?: string;
  createdAt: string;
}

// ── Primaries: Campaign Events ───────────────────────────────────────────

export interface CampaignEvent {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  location: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  candidateId?: string;
  candidate?: PrimaryCandidate;
  rsvpCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: 'interested' | 'going' | 'not_going';
  createdAt: string;
}

// ── Primaries: Gamification ──────────────────────────────────────────────

export interface UserPointEntry {
  id: string;
  userId: string;
  action: string;
  points: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  rank: number;
}

// ── Daily Quiz ─────────────────────────────────────────────────────────

export interface DailyQuizQuestion {
  questionText: string;
  options: { label: string; isCorrect: boolean }[];
  linkedArticleId?: string;
  linkedArticleSlug?: string;
}

export interface DailyQuiz {
  id: string;
  date: string;
  questions: DailyQuizQuestion[];
  isActive: boolean;
  pointsReward: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyQuizWithStats extends DailyQuiz {
  completionCount?: number;
  averageScore?: number;
}

// ── Primaries: Candidate Matcher ────────────────────────────────────────

export type MatcherCategory =
  | 'security'
  | 'economy'
  | 'society'
  | 'law'
  | 'education'
  | 'foreign_policy';

export interface PolicyStatement {
  id: string;
  electionId: string;
  textHe: string;
  textEn?: string;
  category: MatcherCategory;
  defaultWeight: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PositionValue = 'agree' | 'neutral' | 'disagree';

export interface CandidatePosition {
  id: string;
  candidateId: string;
  statementId: string;
  position: PositionValue;
  candidate?: PrimaryCandidate;
  statement?: PolicyStatement;
  createdAt: string;
  updatedAt: string;
}

export interface MatcherStats {
  totalStatements: number;
  activeStatements: number;
  totalPositions: number;
  candidatesWithPositions: number;
  completionRate: number;
}

// ── Knesset List Assembly ──────────────────────────────────────────────

export type KnessetSlotType = 'leader' | 'reserved_minority' | 'reserved_woman' | 'national' | 'district';

export interface KnessetListSlot {
  id: string;
  electionId: string;
  slotNumber: number;
  slotType: KnessetSlotType;
  candidateId: string | null;
  candidate?: {
    id: string;
    fullName: string;
    district: string;
    position: string;
  };
  isConfirmed: boolean;
  assignedById?: string;
  confirmedById?: string;
  confirmedAt?: string;
  notes?: string;
}

export interface SlotStatistics {
  totalSlots: number;
  filledSlots: number;
  confirmedSlots: number;
  byType: Record<KnessetSlotType, number>;
}

// ── Daily Missions ──────────────────────────────────────────────────────

export type MissionType = 'quiz_complete' | 'article_read' | 'poll_vote' | 'share' | 'event_rsvp' | 'comment' | 'login' | 'endorsement';

export interface DailyMission {
  id: string;
  type: MissionType;
  descriptionHe: string;
  descriptionEn: string;
  points: number;
  frequency: string;
  isActive: boolean;
  createdAt: string;
}

// ── Branches ────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  district: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface BranchWeeklyScore {
  branchId: string;
  branchName: string;
  weekStart: string;
  totalScore: number;
  perCapitaScore: number;
  activeMemberCount: number;
  rank: number;
  prevRank: number;
}

// ── AI Quiz Review ──────────────────────────────────────────────────────

export interface AiGeneratedQuiz {
  id: string;
  questions: AiQuizQuestion[];
  sourceArticleIds: string[];
  generatedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedById?: string;
  reviewedAt?: string;
}

export interface AiQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceArticleId?: string;
}

// ── AI Article Summary ──────────────────────────────────────────────────

export interface ArticleAiSummary {
  id: string;
  articleId: string;
  articleTitle?: string;
  summaryHe: string;
  keyPointsHe: string[];
  politicalAngleHe?: string;
  modelUsed: string;
  tokensUsed: number;
  createdAt: string;
}

// ── GOTV ────────────────────────────────────────────────────────────────

export interface GotvEngagement {
  id: string;
  appUserId: string;
  appUserName?: string;
  electionId: string;
  votingPlanTime: string | null;
  stationCheckinAt: string | null;
  votedBadgeClaimedAt: string | null;
  notificationLog: Array<{ type: string; sentAt: string }>;
  remindersEnabled: boolean;
}

export interface GotvStats {
  totalEligible: number;
  votingPlans: number;
  checkedIn: number;
  votedBadges: number;
  notificationsSent: number;
}

// ── Ads: Candidate Ad Marketplace ──────────────────────────────────────

export type AdPlacementType = 'profile_featured' | 'feed_sponsored' | 'push_notification' | 'quiz_end';
export type AdPlacementStatus = 'pending' | 'approved' | 'rejected' | 'paused' | 'ended';

export interface AdTargetingRules {
  districts?: string[];
  ageRange?: { min: number; max: number };
  membersOnly?: boolean;
}

export interface CandidateAdPlacement {
  id: string;
  candidateId: string;
  candidateName?: string;
  placementType: AdPlacementType;
  title: string;
  contentHe: string;
  imageUrl?: string;
  targetingRules?: AdTargetingRules;
  dailyBudgetNis: number;
  cpmNis: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  isApproved: boolean;
  isActive: boolean;
  status: AdPlacementStatus;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  pausedAt?: string;
  endedAt?: string;
  linkedContentType?: 'article' | 'candidate' | 'poll' | 'event' | 'external';
  linkedContentId?: string;
  ctaUrl?: string;
  createdAt: string;
  candidate?: PrimaryCandidate;
}

export interface AdPlacementStats {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  totalSpendNis: number;
  activePlacements: number;
}

export interface AdTypeBreakdown {
  type: AdPlacementType;
  count: number;
  impressions: number;
  clicks: number;
  ctr: number;
  totalSpendNis: number;
  activePlacements: number;
}

export interface AdCandidateBreakdown {
  candidateId: string;
  candidateName: string;
  count: number;
  impressions: number;
  clicks: number;
  totalSpendNis: number;
}

export interface AdBudgetPacing {
  id: string;
  title: string;
  candidateName: string;
  dailyBudgetNis: number;
  currentSpendNis: number;
  pacingPct: number;
  status: AdPlacementStatus;
}

export interface AdBreakdownStats {
  byType: AdTypeBreakdown[];
  byCandidate: AdCandidateBreakdown[];
  budgetPacing: AdBudgetPacing[];
}

// ── Company Ads System ──────────────────────────────────────────────────────

export interface CompanyAdvertiser {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  isActive: boolean;
  ads?: CompanyAd[];
  createdAt: string;
  updatedAt: string;
}

export type CompanyAdType = 'article_banner' | 'feed_native' | 'article_pre_roll';
export type CompanyAdStatus = 'pending' | 'approved' | 'rejected' | 'paused' | 'ended';

export interface CompanyAd {
  id: string;
  advertiserId: string;
  advertiser?: CompanyAdvertiser;
  adType: CompanyAdType;
  title: string;
  contentHe?: string;
  imageUrl?: string;
  ctaUrl?: string;
  ctaLabelHe?: string;
  dailyBudgetNis: number;
  cpmNis: number;
  impressions: number;
  clicks: number;
  startDate?: string;
  endDate?: string;
  isApproved: boolean;
  isActive: boolean;
  status: CompanyAdStatus;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  pausedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── AMA Sessions ─────────────────────────────────────────────────────────────

export type AmaSessionStatus = 'draft' | 'upcoming' | 'live' | 'ended';

export interface AmaSession {
  id: string;
  candidateId: string;
  candidateName?: string;
  title: string;
  description: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: AmaSessionStatus;
  questionCount: number;
  createdAt: string;
}

export type AmaQuestionStatus = 'pending' | 'approved' | 'rejected';

export interface AmaQuestion {
  id: string;
  sessionId: string;
  authorName: string;
  questionText: string;
  answerText: string | null;
  answeredAt: string | null;
  upvoteCount: number;
  status: AmaQuestionStatus;
  isPinned: boolean;
  createdAt: string;
}
