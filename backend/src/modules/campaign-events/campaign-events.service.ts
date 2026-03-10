import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CampaignEvent } from './entities/campaign-event.entity';
import { EventRsvp, RsvpStatus } from './entities/event-rsvp.entity';
import { CreateCampaignEventDto } from './dto/create-campaign-event.dto';
import { UpdateCampaignEventDto } from './dto/update-campaign-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CampaignEventsService {
  private readonly logger = new Logger(CampaignEventsService.name);

  constructor(
    @InjectRepository(CampaignEvent)
    private readonly eventRepository: Repository<CampaignEvent>,
    @InjectRepository(EventRsvp)
    private readonly rsvpRepository: Repository<EventRsvp>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Paginated campaign events list with filtering.
   */
  async findAll(query: QueryEventsDto): Promise<{
    data: CampaignEvent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, electionId, candidateId, district, city, upcoming } = query;
    const skip = (page - 1) * limit;

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.candidate', 'candidate')
      .leftJoinAndSelect('event.election', 'election')
      .where('event.isActive = :isActive', { isActive: true })
      .orderBy('event.startTime', 'ASC')
      .skip(skip)
      .take(limit);

    if (electionId) {
      qb.andWhere('event.electionId = :electionId', { electionId });
    }

    if (candidateId) {
      qb.andWhere('event.candidateId = :candidateId', { candidateId });
    }

    if (district) {
      qb.andWhere('event.district = :district', { district });
    }

    if (city) {
      qb.andWhere('event.city = :city', { city });
    }

    if (upcoming === 'true') {
      qb.andWhere('event.startTime > :now', { now: new Date() });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single campaign event by ID with candidate relation.
   */
  async findOne(id: string): Promise<CampaignEvent> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['candidate', 'election'],
    });

    if (!event) {
      throw new NotFoundException(`Campaign event with id "${id}" not found`);
    }

    return event;
  }

  /**
   * Create a new campaign event.
   */
  async create(dto: CreateCampaignEventDto): Promise<CampaignEvent> {
    const event = this.eventRepository.create(dto);
    const savedEvent = await this.eventRepository.save(event);

    // Fire notification (after saving the event)
    this.notificationsService.triggerContentNotification(
      'event.created',
      'event',
      savedEvent.id,
      {
        event_title: savedEvent.title,
        event_location: savedEvent.location,
      },
    ).catch((err) => this.logger.error(`Event notification failed: ${err.message}`));

    return savedEvent;
  }

  /**
   * Update a campaign event by ID.
   */
  async update(id: string, dto: UpdateCampaignEventDto): Promise<CampaignEvent> {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    return this.eventRepository.save(event);
  }

  /**
   * Soft-delete a campaign event (set isActive=false).
   */
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    event.isActive = false;
    await this.eventRepository.save(event);
  }

  /**
   * Upsert an RSVP for a user on an event.
   * If an RSVP already exists, update its status.
   * Recalculate the event's rsvpCount afterwards.
   */
  async rsvp(userId: string, eventId: string, dto: RsvpEventDto): Promise<EventRsvp> {
    // Ensure the event exists
    await this.findOne(eventId);

    // Check for existing RSVP
    let rsvp = await this.rsvpRepository.findOne({
      where: { userId, eventId },
    });

    if (rsvp) {
      rsvp.status = dto.status;
      rsvp = await this.rsvpRepository.save(rsvp);
    } else {
      rsvp = this.rsvpRepository.create({
        userId,
        eventId,
        status: dto.status,
      });
      rsvp = await this.rsvpRepository.save(rsvp);
    }

    // Recalculate rsvpCount (going + interested)
    const rsvpCount = await this.rsvpRepository.count({
      where: [
        { eventId, status: RsvpStatus.GOING },
        { eventId, status: RsvpStatus.INTERESTED },
      ],
    });

    await this.eventRepository.update(eventId, { rsvpCount });

    return rsvp;
  }

  /**
   * Get a user's RSVP for a specific event.
   */
  async getUserRsvp(userId: string, eventId: string): Promise<EventRsvp | null> {
    return this.rsvpRepository.findOne({
      where: { userId, eventId },
    });
  }

  /**
   * Get paginated RSVPs for an event with user info.
   */
  async getEventRsvps(
    eventId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: EventRsvp[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.rsvpRepository.findAndCount({
      where: { eventId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
