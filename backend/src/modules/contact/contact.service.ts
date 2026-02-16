import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContactMessage> {
    const message = this.contactRepository.create(createContactDto);
    return this.contactRepository.save(message);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    isRead?: boolean,
  ): Promise<{ data: ContactMessage[]; total: number }> {
    const where: any = {};
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [data, total] = await this.contactRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async markAsRead(id: string): Promise<ContactMessage> {
    const message = await this.contactRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Contact message with ID "${id}" not found`);
    }
    message.isRead = true;
    return this.contactRepository.save(message);
  }
}
