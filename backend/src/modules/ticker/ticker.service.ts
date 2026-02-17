import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TickerItem } from './entities/ticker-item.entity';
import { CreateTickerItemDto } from './dto/create-ticker-item.dto';
import { UpdateTickerItemDto } from './dto/update-ticker-item.dto';

@Injectable()
export class TickerService {
  constructor(
    @InjectRepository(TickerItem)
    private readonly tickerItemRepository: Repository<TickerItem>,
  ) {}

  async create(createTickerItemDto: CreateTickerItemDto): Promise<TickerItem> {
    const tickerItem = this.tickerItemRepository.create(createTickerItemDto);
    return this.tickerItemRepository.save(tickerItem);
  }

  async findAll(): Promise<TickerItem[]> {
    return this.tickerItemRepository.find({
      order: { position: 'ASC' },
    });
  }

  async findActive(): Promise<TickerItem[]> {
    const now = new Date();

    const queryBuilder = this.tickerItemRepository
      .createQueryBuilder('ticker')
      .where('ticker.isActive = :isActive', { isActive: true })
      .andWhere('(ticker.expiresAt IS NULL OR ticker.expiresAt > :now)', {
        now,
      })
      .orderBy('ticker.position', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<TickerItem> {
    const tickerItem = await this.tickerItemRepository.findOne({
      where: { id },
    });
    if (!tickerItem) {
      throw new NotFoundException(`Ticker item with ID "${id}" not found`);
    }
    return tickerItem;
  }

  async update(
    id: string,
    updateTickerItemDto: UpdateTickerItemDto,
  ): Promise<TickerItem> {
    const tickerItem = await this.findOne(id);
    Object.assign(tickerItem, updateTickerItemDto);
    return this.tickerItemRepository.save(tickerItem);
  }

  async remove(id: string): Promise<void> {
    const tickerItem = await this.findOne(id);
    await this.tickerItemRepository.remove(tickerItem);
  }

  async reorder(orderedIds: string[]): Promise<TickerItem[]> {
    const updates = orderedIds.map((id, index) =>
      this.tickerItemRepository.update(id, { position: index }),
    );
    await Promise.all(updates);
    return this.findAll();
  }
}
