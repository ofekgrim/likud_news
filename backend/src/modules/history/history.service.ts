import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingHistory } from './entities/reading-history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(ReadingHistory)
    private readonly historyRepository: Repository<ReadingHistory>,
  ) {}

  async recordRead(createHistoryDto: CreateHistoryDto): Promise<ReadingHistory> {
    const existing = await this.historyRepository.findOne({
      where: {
        deviceId: createHistoryDto.deviceId,
        articleId: createHistoryDto.articleId,
      },
    });

    if (existing) {
      existing.readAt = new Date();
      return this.historyRepository.save(existing);
    }

    const history = this.historyRepository.create(createHistoryDto);
    return this.historyRepository.save(history);
  }

  async findByDevice(
    deviceId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ReadingHistory[]; total: number }> {
    const [data, total] = await this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.article', 'article')
      .where('history.deviceId = :deviceId', { deviceId })
      .orderBy('history.readAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
}
