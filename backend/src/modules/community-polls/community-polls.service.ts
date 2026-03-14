import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPoll } from './entities/community-poll.entity';
import { PollVote } from './entities/poll-vote.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationService } from '../gamification/gamification.service';
import { PointAction } from '../gamification/entities/user-points.entity';

@Injectable()
export class CommunityPollsService {
  private readonly logger = new Logger(CommunityPollsService.name);

  constructor(
    @InjectRepository(CommunityPoll)
    private readonly pollRepository: Repository<CommunityPoll>,
    @InjectRepository(PollVote)
    private readonly voteRepository: Repository<PollVote>,
    private readonly notificationsService: NotificationsService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Get all polls, pinned first, then by createdAt DESC. Optionally filter by isActive.
   */
  async findAll(
    isActive?: boolean,
    userId?: string,
  ): Promise<(CommunityPoll & { myVoteOptionIndex: number | null })[]> {
    const qb = this.pollRepository
      .createQueryBuilder('poll')
      .orderBy('poll.isPinned', 'DESC')
      .addOrderBy('poll.createdAt', 'DESC');

    if (isActive !== undefined) {
      qb.where('poll.isActive = :isActive', { isActive });
    }

    // Include the current user's vote in a single query (no N+1)
    if (userId) {
      qb.leftJoin(
        'poll_votes',
        'myVote',
        'myVote."pollId" = poll.id AND myVote."userId" = :userId',
        { userId },
      );
      qb.addSelect('myVote."optionIndex"', 'myVoteOptionIndex');
    }

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((poll, i) => ({
      ...poll,
      myVoteOptionIndex: userId
        ? (raw[i]?.myVoteOptionIndex ?? null)
        : null,
    }));
  }

  /**
   * Find a poll by ID.
   */
  async findOne(id: string): Promise<CommunityPoll> {
    const poll = await this.pollRepository.findOne({ where: { id } });

    if (!poll) {
      throw new NotFoundException(`Poll with id "${id}" not found`);
    }

    return poll;
  }

  /**
   * Create a new poll. Initialize options with voteCount: 0.
   */
  async create(dto: CreatePollDto): Promise<CommunityPoll> {
    const options = dto.options.map((opt) => ({
      label: opt.label,
      voteCount: 0,
    }));

    const poll = this.pollRepository.create({
      question: dto.question,
      description: dto.description,
      options,
      isPinned: dto.isPinned || false,
    });

    const savedPoll = await this.pollRepository.save(poll);

    // Fire notification (after saving the poll)
    this.notificationsService.triggerContentNotification(
      'poll.created',
      'poll',
      savedPoll.id,
      { poll_question: savedPoll.question },
    ).catch((err) => this.logger.error(`Poll notification failed: ${err.message}`));

    return savedPoll;
  }

  /**
   * Update a poll.
   */
  async update(id: string, dto: UpdatePollDto): Promise<CommunityPoll> {
    const poll = await this.findOne(id);
    Object.assign(poll, dto);
    return this.pollRepository.save(poll);
  }

  /**
   * Close a poll.
   */
  async closePoll(id: string): Promise<CommunityPoll> {
    const poll = await this.findOne(id);
    poll.closedAt = new Date();
    poll.isActive = false;
    return this.pollRepository.save(poll);
  }

  /**
   * Cast a vote on a poll.
   * 1. Check if poll is active
   * 2. Check if user already voted
   * 3. Create PollVote
   * 4. Increment totalVotes and option voteCount in JSONB
   * 5. Return updated poll
   */
  async vote(
    userId: string,
    pollId: string,
    dto: VotePollDto,
  ): Promise<CommunityPoll> {
    const poll = await this.findOne(pollId);

    // Check if poll is active and not past its closing date
    if (!poll.isActive || (poll.closedAt && new Date(poll.closedAt) < new Date())) {
      throw new BadRequestException('This poll is no longer active');
    }

    // Validate option index
    if (dto.optionIndex < 0 || dto.optionIndex >= poll.options.length) {
      throw new BadRequestException(
        `Invalid option index. Must be between 0 and ${poll.options.length - 1}`,
      );
    }

    // Check if user already voted
    const existingVote = await this.voteRepository.findOne({
      where: { pollId, userId },
    });

    if (existingVote) {
      throw new ConflictException('You have already voted on this poll');
    }

    // Create the vote
    const vote = this.voteRepository.create({
      pollId,
      userId,
      optionIndex: dto.optionIndex,
    });
    await this.voteRepository.save(vote);

    // Increment totalVotes and the selected option's voteCount
    poll.totalVotes += 1;
    poll.options[dto.optionIndex].voteCount += 1;

    const savedPoll = await this.pollRepository.save(poll);

    // Award gamification points for voting
    this.gamificationService.trackAction(userId, PointAction.POLL_VOTE, {
      pollId,
      optionIndex: dto.optionIndex,
    }).catch((err) => this.logger.error(`Gamification award failed: ${err.message}`));

    return savedPoll;
  }

  /**
   * Check if a user has voted on a poll and return the optionIndex or null.
   */
  async getUserVote(
    userId: string,
    pollId: string,
  ): Promise<{ voted: boolean; optionIndex: number | null }> {
    const vote = await this.voteRepository.findOne({
      where: { pollId, userId },
    });

    return {
      voted: !!vote,
      optionIndex: vote ? vote.optionIndex : null,
    };
  }

  /**
   * Get poll results with option vote counts and percentages.
   */
  async getResults(
    pollId: string,
  ): Promise<{
    poll: CommunityPoll;
    results: { label: string; voteCount: number; percentage: number }[];
  }> {
    const poll = await this.findOne(pollId);

    const results = poll.options.map((opt) => ({
      label: opt.label,
      voteCount: opt.voteCount,
      percentage:
        poll.totalVotes > 0
          ? parseFloat(((opt.voteCount / poll.totalVotes) * 100).toFixed(2))
          : 0,
    }));

    return { poll, results };
  }

  /**
   * Soft-delete a poll by setting isActive = false.
   */
  async remove(id: string): Promise<void> {
    const poll = await this.findOne(id);
    poll.isActive = false;
    await this.pollRepository.save(poll);
  }
}
