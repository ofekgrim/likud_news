import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { ResolvedNotification } from './interfaces/notification-context.interface';

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
  ) {}

  async findAll(): Promise<NotificationTemplate[]> {
    return this.templateRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async findOne(id: string): Promise<NotificationTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    return this.templateRepo.findOne({ where: { name } });
  }

  async findByTriggerEvent(triggerEvent: string): Promise<NotificationTemplate[]> {
    return this.templateRepo.find({
      where: { triggerEvent, isAutoTrigger: true, isActive: true },
    });
  }

  async create(
    dto: CreateNotificationTemplateDto,
    userId?: string,
  ): Promise<NotificationTemplate> {
    const existing = await this.templateRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Template with name "${dto.name}" already exists`);
    }

    const template = this.templateRepo.create({
      ...dto,
      createdById: userId,
    });
    return this.templateRepo.save(template);
  }

  async update(
    id: string,
    dto: UpdateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    const template = await this.findOne(id);

    if (dto.name && dto.name !== template.name) {
      const existing = await this.templateRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Template with name "${dto.name}" already exists`);
      }
    }

    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepo.remove(template);
  }

  /**
   * Interpolate template strings with variable values.
   * Replaces {{variable_name}} with the corresponding value.
   */
  interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Resolve a template with context variables into a ready-to-send notification.
   */
  resolveTemplate(
    template: NotificationTemplate,
    variables: Record<string, string>,
  ): ResolvedNotification {
    return {
      title: this.interpolate(template.titleTemplate, variables),
      body: this.interpolate(template.bodyTemplate, variables),
      imageUrl: template.imageUrlTemplate
        ? this.interpolate(template.imageUrlTemplate, variables)
        : undefined,
    };
  }
}
