import { createHash } from 'crypto';
import {
  Injectable,
  NotFoundException,
  Inject,
  Optional,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { PollingStation } from './entities/polling-station.entity';
import { StationReport } from './entities/station-report.entity';
import { CreatePollingStationDto } from './dto/create-polling-station.dto';
import { UpdatePollingStationDto } from './dto/update-polling-station.dto';
import { CreateStationReportDto } from './dto/create-station-report.dto';
import { QueryStationsDto } from './dto/query-stations.dto';
import { SseService } from '../sse/sse.service';

export type TrafficLight = 'green' | 'yellow' | 'red';

export interface StationWaitInfo {
  avgWaitMinutes: number | null;
  trafficLight: TrafficLight | null;
  reportCount: number;
}

@Injectable()
export class PollingStationsService {
  private readonly logger = new Logger(PollingStationsService.name);

  /** Rate-limit window: 1 report per station per user per 30 min. */
  private static readonly REPORT_RATE_LIMIT_SECONDS = 30 * 60;

  constructor(
    @InjectRepository(PollingStation)
    private readonly stationRepository: Repository<PollingStation>,
    @InjectRepository(StationReport)
    private readonly reportRepository: Repository<StationReport>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Optional() @Inject(SseService) private readonly sseService?: SseService,
  ) {}

  /**
   * Paginated stations list with filtering, proximity search, and wait-time data.
   */
  async findAll(query: QueryStationsDto): Promise<{
    data: (PollingStation & StationWaitInfo)[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      electionId,
      district,
      city,
      latitude,
      longitude,
      radius,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.stationRepository
      .createQueryBuilder('station')
      .where('station.isActive = :isActive', { isActive: true })
      .orderBy('station.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (electionId) {
      qb.andWhere('station.electionId = :electionId', { electionId });
    }

    if (district) {
      qb.andWhere('station.district = :district', { district });
    }

    if (city) {
      qb.andWhere('station.city = :city', { city });
    }

    // Proximity search using Haversine formula
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius || '5');

      qb.andWhere('station.latitude IS NOT NULL')
        .andWhere('station.longitude IS NOT NULL')
        .andWhere(
          `(
            6371 * acos(
              cos(radians(:lat)) * cos(radians(station.latitude)) *
              cos(radians(station.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(station.latitude))
            )
          ) <= :radiusKm`,
          { lat, lng, radiusKm },
        )
        .addSelect(
          `(
            6371 * acos(
              cos(radians(:lat)) * cos(radians(station.latitude)) *
              cos(radians(station.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(station.latitude))
            )
          )`,
          'distance',
        )
        .orderBy('distance', 'ASC');
    }

    const [data, total] = await qb.getManyAndCount();

    // Enrich stations with 2-hour rolling wait-time averages
    const enriched = await this.enrichWithWaitTimes(data);

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single station by ID with latest reports.
   */
  async findOne(id: string): Promise<PollingStation> {
    const station = await this.stationRepository.findOne({
      where: { id },
      relations: ['election'],
    });

    if (!station) {
      throw new NotFoundException(`Polling station with id "${id}" not found`);
    }

    return station;
  }

  /**
   * Create a new polling station.
   */
  async create(dto: CreatePollingStationDto): Promise<PollingStation> {
    const station = this.stationRepository.create(dto);
    return this.stationRepository.save(station);
  }

  /**
   * Update a polling station by ID.
   */
  async update(
    id: string,
    dto: UpdatePollingStationDto,
  ): Promise<PollingStation> {
    const station = await this.findOne(id);
    Object.assign(station, dto);
    return this.stationRepository.save(station);
  }

  /**
   * Soft-delete a polling station (set isActive=false).
   */
  async remove(id: string): Promise<void> {
    const station = await this.findOne(id);
    station.isActive = false;
    await this.stationRepository.save(station);
  }

  /**
   * Add a report for a polling station.
   * Rate-limited: 1 report per station per user per 30 minutes (via Redis).
   * Emits SSE event after successful submission.
   */
  async addReport(
    userId: string,
    dto: CreateStationReportDto,
  ): Promise<StationReport> {
    // Verify station exists
    await this.findOne(dto.stationId);

    // Hash userId — never store raw user identity alongside GPS location
    const userIdHash = createHash('sha256').update(userId).digest('hex');

    // Rate-limit: 1 report per station per user per 30 min
    const rateLimitKey = `station_report:${dto.stationId}:${userIdHash}`;
    const existing = await this.cacheManager.get(rateLimitKey);
    if (existing) {
      throw new BadRequestException(
        'You can only submit one report per station every 30 minutes',
      );
    }

    const report = this.reportRepository.create({
      stationId: dto.stationId,
      userIdHash,
      waitTimeMinutes: dto.waitTimeMinutes,
      crowdLevel: dto.crowdLevel || 'moderate',
      note: dto.note,
    });

    const saved = await this.reportRepository.save(report);

    // Set rate-limit key with 30-min TTL (in milliseconds for cache-manager)
    await this.cacheManager.set(
      rateLimitKey,
      '1',
      PollingStationsService.REPORT_RATE_LIMIT_SECONDS * 1000,
    );

    // Emit SSE event with updated wait-time data
    this.emitStationWaitUpdate(dto.stationId);

    return saved;
  }

  /**
   * Get latest reports for a station ordered by reportedAt DESC.
   */
  async getReports(
    stationId: string,
    limit: number = 10,
  ): Promise<StationReport[]> {
    return this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .where('report.stationId = :stationId', { stationId })
      .orderBy('report.reportedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Calculate average wait time from reports in the last 2 hours.
   */
  async getAverageWaitTime(
    stationId: string,
  ): Promise<{ averageWaitTime: number | null; reportCount: number }> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await this.reportRepository
      .createQueryBuilder('report')
      .select('AVG(report.waitTimeMinutes)', 'avg')
      .addSelect('COUNT(report.id)', 'count')
      .where('report.stationId = :stationId', { stationId })
      .andWhere('report.reportedAt >= :twoHoursAgo', { twoHoursAgo })
      .getRawOne();

    return {
      averageWaitTime: result.avg ? parseFloat(result.avg) : null,
      reportCount: parseInt(result.count, 10),
    };
  }

  /**
   * Bulk import multiple polling stations.
   */
  async bulkImport(
    stations: CreatePollingStationDto[],
  ): Promise<PollingStation[]> {
    const entities = stations.map((dto) => this.stationRepository.create(dto));
    return this.stationRepository.save(entities);
  }

  // ═══════════════════════════════════════════════════════════════════
  // WAIT-TIME ENRICHMENT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Compute traffic-light color from average wait minutes.
   * Green: < 10 min, Yellow: 10-30 min, Red: > 30 min.
   */
  computeTrafficLight(avgMinutes: number): TrafficLight {
    if (avgMinutes < 10) return 'green';
    if (avgMinutes <= 30) return 'yellow';
    return 'red';
  }

  /**
   * Batch-enrich stations with 2-hour rolling average wait times.
   * Uses a single query to fetch averages for all station IDs.
   */
  async enrichWithWaitTimes(
    stations: PollingStation[],
  ): Promise<(PollingStation & StationWaitInfo)[]> {
    if (stations.length === 0) return [];

    const stationIds = stations.map((s) => s.id);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Batch query: average wait time per station for reports in the last 2 hours
    const rawResults = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.stationId', 'stationId')
      .addSelect('AVG(report.waitTimeMinutes)', 'avg')
      .addSelect('COUNT(report.id)', 'count')
      .where('report.stationId IN (:...stationIds)', { stationIds })
      .andWhere('report.reportedAt >= :twoHoursAgo', { twoHoursAgo })
      .groupBy('report.stationId')
      .getRawMany();

    // Build lookup map: stationId -> { avg, count }
    const waitMap = new Map<string, { avg: number; count: number }>();
    for (const row of rawResults) {
      waitMap.set(row.stationId, {
        avg: parseFloat(row.avg),
        count: parseInt(row.count, 10),
      });
    }

    // Merge wait-time info into each station
    return stations.map((station) => {
      const waitData = waitMap.get(station.id);
      const avgWaitMinutes = waitData
        ? Math.round(waitData.avg * 10) / 10
        : null;
      const trafficLight =
        avgWaitMinutes !== null
          ? this.computeTrafficLight(avgWaitMinutes)
          : null;
      const reportCount = waitData ? waitData.count : 0;

      return {
        ...station,
        avgWaitMinutes,
        trafficLight,
        reportCount,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SSE EMISSION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Emit an SSE event with updated wait-time data for a station.
   * Runs asynchronously (fire-and-forget) so it does not block the response.
   */
  private emitStationWaitUpdate(stationId: string): void {
    if (!this.sseService) return;

    // Fire-and-forget — errors are logged, not thrown
    this.getAverageWaitTime(stationId)
      .then(({ averageWaitTime, reportCount }) => {
        const avgWaitMinutes =
          averageWaitTime !== null
            ? Math.round(averageWaitTime * 10) / 10
            : null;
        const trafficLight =
          avgWaitMinutes !== null
            ? this.computeTrafficLight(avgWaitMinutes)
            : null;

        this.sseService!.emitStationWaitUpdate({
          stationId,
          avgWaitMinutes,
          trafficLight,
          reportCount,
        });

        this.logger.log(
          `SSE station_wait_update emitted for station ${stationId}: ` +
            `avg=${avgWaitMinutes}min, traffic=${trafficLight}, reports=${reportCount}`,
        );
      })
      .catch((err) => {
        this.logger.error(
          `Failed to emit station_wait_update for station ${stationId}`,
          err,
        );
      });
  }
}
