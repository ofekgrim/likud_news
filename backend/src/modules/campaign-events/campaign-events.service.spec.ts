import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CampaignEventsService } from './campaign-events.service';
import { CampaignEvent } from './entities/campaign-event.entity';
import { EventRsvp, RsvpStatus } from './entities/event-rsvp.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  clone: jest.fn(),
});

describe('CampaignEventsService', () => {
  let service: CampaignEventsService;
  let eventRepository: jest.Mocked<Repository<CampaignEvent>>;
  let rsvpRepository: jest.Mocked<Repository<EventRsvp>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignEventsService,
        { provide: getRepositoryToken(CampaignEvent), useFactory: mockRepository },
        { provide: getRepositoryToken(EventRsvp), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<CampaignEventsService>(CampaignEventsService);
    eventRepository = module.get(getRepositoryToken(CampaignEvent));
    rsvpRepository = module.get(getRepositoryToken(EventRsvp));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated events with default params', async () => {
      const events = [
        { id: 'event-1', title: 'Rally in Tel Aviv' },
        { id: 'event-2', title: 'Town Hall Jerusalem' },
      ] as CampaignEvent[];

      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([events, 2]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: events,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('event.candidate', 'candidate');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('event.election', 'election');
      expect(mockQb.where).toHaveBeenCalledWith('event.isActive = :isActive', { isActive: true });
      expect(mockQb.orderBy).toHaveBeenCalledWith('event.startTime', 'ASC');
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(20);
    });

    it('should apply electionId filter', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll({ page: 1, limit: 10, electionId: 'election-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'event.electionId = :electionId',
        { electionId: 'election-1' },
      );
    });

    it('should apply candidateId filter', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll({ page: 1, limit: 10, candidateId: 'candidate-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'event.candidateId = :candidateId',
        { candidateId: 'candidate-1' },
      );
    });

    it('should apply district filter', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll({ page: 1, limit: 10, district: 'Tel Aviv' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'event.district = :district',
        { district: 'Tel Aviv' },
      );
    });

    it('should apply city filter', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll({ page: 1, limit: 10, city: 'Haifa' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'event.city = :city',
        { city: 'Haifa' },
      );
    });

    it('should apply upcoming filter when set to "true"', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll({ page: 1, limit: 10, upcoming: 'true' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'event.startTime > :now',
        expect.objectContaining({ now: expect.any(Date) }),
      );
    });

    it('should calculate correct pagination offset for page 2', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 50]);
      eventRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockQb.skip).toHaveBeenCalledWith(10);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(result.totalPages).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return an event with candidate and election relations', async () => {
      const event = {
        id: 'event-1',
        title: 'Rally in Tel Aviv',
        candidate: { id: 'cand-1', name: 'Candidate' },
        election: { id: 'elec-1', title: 'Primary 2026' },
      } as CampaignEvent;

      eventRepository.findOne.mockResolvedValue(event);

      const result = await service.findOne('event-1');

      expect(result).toEqual(event);
      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        relations: ['candidate', 'election'],
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create and save a campaign event', async () => {
      const dto = {
        title: 'New Rally',
        description: 'A big rally',
        city: 'Jerusalem',
        startTime: '2026-03-15T18:00:00.000Z',
      } as any;

      const event = { id: 'event-new', ...dto } as CampaignEvent;

      eventRepository.create.mockReturnValue(event);
      eventRepository.save.mockResolvedValue(event);

      const result = await service.create(dto);

      expect(result).toEqual(event);
      expect(eventRepository.create).toHaveBeenCalledWith(dto);
      expect(eventRepository.save).toHaveBeenCalledWith(event);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update event fields and save', async () => {
      const existingEvent = {
        id: 'event-1',
        title: 'Old Title',
        city: 'Haifa',
        isActive: true,
      } as CampaignEvent;

      const dto = { title: 'Updated Title', city: 'Tel Aviv' } as any;

      eventRepository.findOne.mockResolvedValue(existingEvent);
      eventRepository.save.mockImplementation(async (e) => e as CampaignEvent);

      const result = await service.update('event-1', dto);

      expect(result.title).toBe('Updated Title');
      expect(result.city).toBe('Tel Aviv');
      expect(eventRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating nonexistent event', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should soft-delete by setting isActive=false', async () => {
      const event = {
        id: 'event-1',
        title: 'Rally',
        isActive: true,
      } as CampaignEvent;

      eventRepository.findOne.mockResolvedValue(event);
      eventRepository.save.mockImplementation(async (e) => e as CampaignEvent);

      await service.remove('event-1');

      expect(event.isActive).toBe(false);
      expect(eventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException when removing nonexistent event', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // rsvp
  // ---------------------------------------------------------------------------
  describe('rsvp', () => {
    const existingEvent = {
      id: 'event-1',
      title: 'Rally',
      isActive: true,
    } as CampaignEvent;

    it('should create a new RSVP when user has not RSVPed', async () => {
      eventRepository.findOne.mockResolvedValue(existingEvent);
      rsvpRepository.findOne.mockResolvedValue(null);

      const newRsvp = {
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: RsvpStatus.GOING,
      } as EventRsvp;

      rsvpRepository.create.mockReturnValue(newRsvp);
      rsvpRepository.save.mockResolvedValue(newRsvp);
      rsvpRepository.count.mockResolvedValue(5);
      eventRepository.update.mockResolvedValue(undefined as any);

      const result = await service.rsvp('user-1', 'event-1', {
        status: RsvpStatus.GOING,
      });

      expect(result).toEqual(newRsvp);
      expect(rsvpRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        eventId: 'event-1',
        status: RsvpStatus.GOING,
      });
      expect(rsvpRepository.save).toHaveBeenCalledWith(newRsvp);
      expect(rsvpRepository.count).toHaveBeenCalledWith({
        where: [
          { eventId: 'event-1', status: RsvpStatus.GOING },
          { eventId: 'event-1', status: RsvpStatus.INTERESTED },
        ],
      });
      expect(eventRepository.update).toHaveBeenCalledWith('event-1', {
        rsvpCount: 5,
      });
    });

    it('should update existing RSVP status when user already RSVPed', async () => {
      eventRepository.findOne.mockResolvedValue(existingEvent);

      const existingRsvp = {
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: RsvpStatus.INTERESTED,
      } as EventRsvp;

      rsvpRepository.findOne.mockResolvedValue(existingRsvp);

      const updatedRsvp = { ...existingRsvp, status: RsvpStatus.GOING } as EventRsvp;
      rsvpRepository.save.mockResolvedValue(updatedRsvp);
      rsvpRepository.count.mockResolvedValue(3);
      eventRepository.update.mockResolvedValue(undefined as any);

      const result = await service.rsvp('user-1', 'event-1', {
        status: RsvpStatus.GOING,
      });

      expect(result.status).toBe(RsvpStatus.GOING);
      expect(rsvpRepository.create).not.toHaveBeenCalled();
      expect(rsvpRepository.save).toHaveBeenCalled();
    });

    it('should recalculate rsvpCount after RSVP', async () => {
      eventRepository.findOne.mockResolvedValue(existingEvent);
      rsvpRepository.findOne.mockResolvedValue(null);

      const newRsvp = {
        id: 'rsvp-2',
        userId: 'user-2',
        eventId: 'event-1',
        status: RsvpStatus.INTERESTED,
      } as EventRsvp;

      rsvpRepository.create.mockReturnValue(newRsvp);
      rsvpRepository.save.mockResolvedValue(newRsvp);
      rsvpRepository.count.mockResolvedValue(12);
      eventRepository.update.mockResolvedValue(undefined as any);

      await service.rsvp('user-2', 'event-1', {
        status: RsvpStatus.INTERESTED,
      });

      expect(eventRepository.update).toHaveBeenCalledWith('event-1', {
        rsvpCount: 12,
      });
    });

    it('should throw NotFoundException when event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rsvp('user-1', 'nonexistent', { status: RsvpStatus.GOING }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserRsvp
  // ---------------------------------------------------------------------------
  describe('getUserRsvp', () => {
    it('should return the RSVP when found', async () => {
      const rsvp = {
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: RsvpStatus.GOING,
      } as EventRsvp;

      rsvpRepository.findOne.mockResolvedValue(rsvp);

      const result = await service.getUserRsvp('user-1', 'event-1');

      expect(result).toEqual(rsvp);
      expect(rsvpRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', eventId: 'event-1' },
      });
    });

    it('should return null when no RSVP exists', async () => {
      rsvpRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserRsvp('user-1', 'event-1');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getEventRsvps
  // ---------------------------------------------------------------------------
  describe('getEventRsvps', () => {
    it('should return paginated RSVPs with user relation', async () => {
      const rsvps = [
        { id: 'rsvp-1', userId: 'user-1', status: RsvpStatus.GOING, user: { displayName: 'Alice' } },
        { id: 'rsvp-2', userId: 'user-2', status: RsvpStatus.INTERESTED, user: { displayName: 'Bob' } },
      ] as any[];

      rsvpRepository.findAndCount.mockResolvedValue([rsvps, 2]);

      const result = await service.getEventRsvps('event-1', 1, 20);

      expect(result).toEqual({
        data: rsvps,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(rsvpRepository.findAndCount).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should calculate correct pagination for page 3', async () => {
      rsvpRepository.findAndCount.mockResolvedValue([[], 45]);

      const result = await service.getEventRsvps('event-1', 3, 10);

      expect(result.totalPages).toBe(5);
      expect(result.page).toBe(3);
      expect(rsvpRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should use default page=1 and limit=20', async () => {
      rsvpRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getEventRsvps('event-1');

      expect(rsvpRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });
});
