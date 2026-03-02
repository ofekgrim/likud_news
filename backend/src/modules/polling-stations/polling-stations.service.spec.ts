import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PollingStationsService } from './polling-stations.service';
import { PollingStation } from './entities/polling-station.entity';
import { StationReport } from './entities/station-report.entity';

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
  setParameters: jest.fn().mockReturnThis(),
  getQuery: jest.fn().mockReturnValue('subquery'),
  getParameters: jest.fn().mockReturnValue({}),
});

describe('PollingStationsService', () => {
  let service: PollingStationsService;
  let stationRepository: jest.Mocked<Repository<PollingStation>>;
  let reportRepository: jest.Mocked<Repository<StationReport>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollingStationsService,
        { provide: getRepositoryToken(PollingStation), useFactory: mockRepository },
        { provide: getRepositoryToken(StationReport), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<PollingStationsService>(PollingStationsService);
    stationRepository = module.get(getRepositoryToken(PollingStation));
    reportRepository = module.get(getRepositoryToken(StationReport));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    let qb: ReturnType<typeof mockQueryBuilder>;

    beforeEach(() => {
      qb = mockQueryBuilder();
      stationRepository.createQueryBuilder.mockReturnValue(qb as any);
    });

    it('should return paginated stations with default page and limit', async () => {
      const stations = [
        { id: 'station-1', name: 'Station A', isActive: true },
        { id: 'station-2', name: 'Station B', isActive: true },
      ] as PollingStation[];

      qb.getManyAndCount.mockResolvedValue([stations, 2]);

      const result = await service.findAll({});

      expect(stationRepository.createQueryBuilder).toHaveBeenCalledWith('station');
      expect(qb.where).toHaveBeenCalledWith('station.isActive = :isActive', { isActive: true });
      expect(qb.orderBy).toHaveBeenCalledWith('station.createdAt', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        data: stations,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply correct skip for page 2', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 2, limit: 10 });

      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('should calculate totalPages correctly', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 45]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.totalPages).toBe(3); // Math.ceil(45/20) = 3
      expect(result.total).toBe(45);
    });

    it('should filter by electionId when provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ electionId: 'election-uuid-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('station.electionId = :electionId', {
        electionId: 'election-uuid-1',
      });
    });

    it('should filter by district when provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ district: 'North' });

      expect(qb.andWhere).toHaveBeenCalledWith('station.district = :district', {
        district: 'North',
      });
    });

    it('should filter by city when provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ city: 'Tel Aviv' });

      expect(qb.andWhere).toHaveBeenCalledWith('station.city = :city', {
        city: 'Tel Aviv',
      });
    });

    it('should apply proximity search when latitude and longitude are provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        latitude: '32.0853',
        longitude: '34.7818',
        radius: '10',
      });

      // Should add null checks for lat/lng columns
      expect(qb.andWhere).toHaveBeenCalledWith('station.latitude IS NOT NULL');
      expect(qb.andWhere).toHaveBeenCalledWith('station.longitude IS NOT NULL');
      // Should add Haversine distance filter
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('6371 * acos'),
        expect.objectContaining({ lat: 32.0853, lng: 34.7818, radiusKm: 10 }),
      );
      // Should add distance select
      expect(qb.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('6371 * acos'),
        'distance',
      );
      // Should order by distance
      expect(qb.orderBy).toHaveBeenCalledWith('distance', 'ASC');
    });

    it('should use default radius of 5 km when not specified', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        latitude: '32.0853',
        longitude: '34.7818',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('6371 * acos'),
        expect.objectContaining({ radiusKm: 5 }),
      );
    });

    it('should combine multiple filters simultaneously', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        electionId: 'election-uuid-1',
        district: 'Central',
        city: 'Herzliya',
        page: 3,
        limit: 5,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('station.electionId = :electionId', {
        electionId: 'election-uuid-1',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('station.district = :district', {
        district: 'Central',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('station.city = :city', {
        city: 'Herzliya',
      });
      expect(qb.skip).toHaveBeenCalledWith(10); // (3-1)*5
      expect(qb.take).toHaveBeenCalledWith(5);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a station when found', async () => {
      const station = {
        id: 'station-uuid-1',
        name: 'Station A',
        address: '123 Main St',
        isActive: true,
      } as PollingStation;

      stationRepository.findOne.mockResolvedValue(station);

      const result = await service.findOne('station-uuid-1');

      expect(result).toEqual(station);
      expect(stationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'station-uuid-1' },
        relations: ['election'],
      });
    });

    it('should throw NotFoundException when station not found', async () => {
      stationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Polling station with id "nonexistent" not found',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create and save a new polling station', async () => {
      const dto = {
        name: 'Station A',
        address: '123 Main St',
        city: 'Tel Aviv',
        district: 'Central',
        latitude: 32.0853,
        longitude: 34.7818,
        capacity: 500,
        isAccessible: true,
        openingTime: '07:00',
        closingTime: '22:00',
      } as any;

      const station = {
        id: 'station-uuid-1',
        ...dto,
        isActive: true,
        createdAt: new Date(),
      } as PollingStation;

      stationRepository.create.mockReturnValue(station);
      stationRepository.save.mockResolvedValue(station);

      const result = await service.create(dto);

      expect(stationRepository.create).toHaveBeenCalledWith(dto);
      expect(stationRepository.save).toHaveBeenCalledWith(station);
      expect(result).toEqual(station);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update and save an existing polling station', async () => {
      const id = 'station-uuid-1';
      const existing = {
        id,
        name: 'Old Station',
        address: '123 Main St',
        isActive: true,
      } as PollingStation;
      const dto = { name: 'Updated Station', capacity: 300 } as any;
      const updated = { ...existing, name: 'Updated Station', capacity: 300 } as PollingStation;

      stationRepository.findOne.mockResolvedValue(existing);
      stationRepository.save.mockResolvedValue(updated);

      const result = await service.update(id, dto);

      expect(stationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['election'],
      });
      expect(stationRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Station');
    });

    it('should throw NotFoundException when station does not exist', async () => {
      stationRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(NotFoundException);
      expect(stationRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should soft-delete a station by setting isActive to false', async () => {
      const id = 'station-uuid-1';
      const station = { id, name: 'Station A', isActive: true } as PollingStation;

      stationRepository.findOne.mockResolvedValue(station);
      stationRepository.save.mockResolvedValue({ ...station, isActive: false } as PollingStation);

      await service.remove(id);

      expect(stationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['election'],
      });
      expect(station.isActive).toBe(false);
      expect(stationRepository.save).toHaveBeenCalledWith(station);
    });

    it('should throw NotFoundException when station does not exist', async () => {
      stationRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
      expect(stationRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // addReport
  // ---------------------------------------------------------------------------
  describe('addReport', () => {
    it('should create and save a report for an existing station', async () => {
      const userId = 'user-uuid-1';
      const dto = {
        stationId: 'station-uuid-1',
        waitTimeMinutes: 15,
        crowdLevel: 'high',
        note: 'Long queue at entrance',
      };

      const station = { id: 'station-uuid-1', isActive: true } as PollingStation;
      const report = {
        id: 'report-uuid-1',
        stationId: dto.stationId,
        userId,
        waitTimeMinutes: 15,
        crowdLevel: 'high',
        note: 'Long queue at entrance',
        reportedAt: new Date(),
      } as StationReport;

      stationRepository.findOne.mockResolvedValue(station);
      reportRepository.create.mockReturnValue(report);
      reportRepository.save.mockResolvedValue(report);

      const result = await service.addReport(userId, dto);

      expect(stationRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.stationId },
        relations: ['election'],
      });
      expect(reportRepository.create).toHaveBeenCalledWith({
        stationId: dto.stationId,
        userId,
        waitTimeMinutes: 15,
        crowdLevel: 'high',
        note: 'Long queue at entrance',
      });
      expect(reportRepository.save).toHaveBeenCalledWith(report);
      expect(result).toEqual(report);
    });

    it('should default crowdLevel to moderate when not provided', async () => {
      const userId = 'user-uuid-1';
      const dto = {
        stationId: 'station-uuid-1',
        waitTimeMinutes: 5,
      } as any;

      const station = { id: 'station-uuid-1', isActive: true } as PollingStation;
      const report = {
        id: 'report-uuid-1',
        stationId: dto.stationId,
        userId,
        waitTimeMinutes: 5,
        crowdLevel: 'moderate',
        reportedAt: new Date(),
      } as StationReport;

      stationRepository.findOne.mockResolvedValue(station);
      reportRepository.create.mockReturnValue(report);
      reportRepository.save.mockResolvedValue(report);

      await service.addReport(userId, dto);

      expect(reportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ crowdLevel: 'moderate' }),
      );
    });

    it('should throw NotFoundException when station does not exist', async () => {
      stationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addReport('user-uuid-1', {
          stationId: 'nonexistent',
          waitTimeMinutes: 10,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(reportRepository.create).not.toHaveBeenCalled();
      expect(reportRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getReports
  // ---------------------------------------------------------------------------
  describe('getReports', () => {
    it('should return reports ordered by reportedAt DESC with user joined', async () => {
      const stationId = 'station-uuid-1';
      const reports = [
        { id: 'r1', stationId, waitTimeMinutes: 20, reportedAt: new Date('2026-02-22T14:00:00Z') },
        { id: 'r2', stationId, waitTimeMinutes: 10, reportedAt: new Date('2026-02-22T13:00:00Z') },
      ] as StationReport[];

      const qb = mockQueryBuilder();
      reportRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue(reports);

      const result = await service.getReports(stationId);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith('report');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('report.user', 'user');
      expect(qb.where).toHaveBeenCalledWith('report.stationId = :stationId', { stationId });
      expect(qb.orderBy).toHaveBeenCalledWith('report.reportedAt', 'DESC');
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual(reports);
    });

    it('should accept a custom limit parameter', async () => {
      const qb = mockQueryBuilder();
      reportRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      await service.getReports('station-uuid-1', 25);

      expect(qb.take).toHaveBeenCalledWith(25);
    });
  });

  // ---------------------------------------------------------------------------
  // getAverageWaitTime
  // ---------------------------------------------------------------------------
  describe('getAverageWaitTime', () => {
    it('should return average wait time and report count', async () => {
      const stationId = 'station-uuid-1';
      const qb = mockQueryBuilder();
      reportRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getRawOne.mockResolvedValue({ avg: '15.50', count: '4' });

      const result = await service.getAverageWaitTime(stationId);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith('report');
      expect(qb.select).toHaveBeenCalledWith('AVG(report.waitTimeMinutes)', 'avg');
      expect(qb.addSelect).toHaveBeenCalledWith('COUNT(report.id)', 'count');
      expect(qb.where).toHaveBeenCalledWith('report.stationId = :stationId', { stationId });
      expect(qb.andWhere).toHaveBeenCalledWith('report.reportedAt >= :twoHoursAgo', {
        twoHoursAgo: expect.any(Date),
      });
      expect(result).toEqual({
        averageWaitTime: 15.5,
        reportCount: 4,
      });
    });

    it('should return null averageWaitTime when no reports exist', async () => {
      const qb = mockQueryBuilder();
      reportRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getRawOne.mockResolvedValue({ avg: null, count: '0' });

      const result = await service.getAverageWaitTime('station-uuid-1');

      expect(result).toEqual({
        averageWaitTime: null,
        reportCount: 0,
      });
    });

    it('should filter reports within the last 2 hours', async () => {
      const qb = mockQueryBuilder();
      reportRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getRawOne.mockResolvedValue({ avg: '10', count: '2' });

      const beforeCall = Date.now();
      await service.getAverageWaitTime('station-uuid-1');
      const afterCall = Date.now();

      const twoHoursMs = 2 * 60 * 60 * 1000;
      const callArgs = qb.andWhere.mock.calls.find(
        (call) => call[0] === 'report.reportedAt >= :twoHoursAgo',
      );
      expect(callArgs).toBeDefined();
      const twoHoursAgo = callArgs![1].twoHoursAgo as Date;
      expect(twoHoursAgo.getTime()).toBeGreaterThanOrEqual(beforeCall - twoHoursMs - 50);
      expect(twoHoursAgo.getTime()).toBeLessThanOrEqual(afterCall - twoHoursMs + 50);
    });
  });

  // ---------------------------------------------------------------------------
  // bulkImport
  // ---------------------------------------------------------------------------
  describe('bulkImport', () => {
    it('should create and save multiple stations', async () => {
      const dtos = [
        { name: 'Station A', address: '111 First St' },
        { name: 'Station B', address: '222 Second St' },
        { name: 'Station C', address: '333 Third St' },
      ] as any[];

      const entities = dtos.map((dto, i) => ({
        id: `station-uuid-${i + 1}`,
        ...dto,
        isActive: true,
      })) as PollingStation[];

      stationRepository.create
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1])
        .mockReturnValueOnce(entities[2]);
      stationRepository.save.mockResolvedValue(entities);

      const result = await service.bulkImport(dtos);

      expect(stationRepository.create).toHaveBeenCalledTimes(3);
      expect(stationRepository.create).toHaveBeenCalledWith(dtos[0]);
      expect(stationRepository.create).toHaveBeenCalledWith(dtos[1]);
      expect(stationRepository.create).toHaveBeenCalledWith(dtos[2]);
      expect(stationRepository.save).toHaveBeenCalledWith(entities);
      expect(result).toEqual(entities);
    });

    it('should handle empty array input', async () => {
      stationRepository.save.mockResolvedValue([]);

      const result = await service.bulkImport([]);

      expect(stationRepository.create).not.toHaveBeenCalled();
      expect(stationRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });
});
