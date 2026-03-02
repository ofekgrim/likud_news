import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PollingStation } from './entities/polling-station.entity';
import { StationReport } from './entities/station-report.entity';
import { CreatePollingStationDto } from './dto/create-polling-station.dto';
import { UpdatePollingStationDto } from './dto/update-polling-station.dto';
import { CreateStationReportDto } from './dto/create-station-report.dto';
import { QueryStationsDto } from './dto/query-stations.dto';

@Injectable()
export class PollingStationsService {
  constructor(
    @InjectRepository(PollingStation)
    private readonly stationRepository: Repository<PollingStation>,
    @InjectRepository(StationReport)
    private readonly reportRepository: Repository<StationReport>,
  ) {}

  /**
   * Paginated stations list with filtering and proximity search.
   */
  async findAll(query: QueryStationsDto): Promise<{
    data: PollingStation[];
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

    return {
      data,
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
   */
  async addReport(
    userId: string,
    dto: CreateStationReportDto,
  ): Promise<StationReport> {
    // Verify station exists
    await this.findOne(dto.stationId);

    const report = this.reportRepository.create({
      stationId: dto.stationId,
      userId,
      waitTimeMinutes: dto.waitTimeMinutes,
      crowdLevel: dto.crowdLevel || 'moderate',
      note: dto.note,
    });

    return this.reportRepository.save(report);
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
}
