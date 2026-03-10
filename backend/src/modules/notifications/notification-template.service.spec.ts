import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationContentType } from './enums/notification.enums';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const buildTemplate = (
  overrides: Partial<NotificationTemplate> = {},
): NotificationTemplate =>
  ({
    id: 'tpl-uuid-1',
    name: 'breaking_news',
    titleTemplate: 'Breaking: {{headline}}',
    bodyTemplate: '{{summary}} — read more on {{source}}',
    imageUrlTemplate: 'https://cdn.example.com/{{image_key}}.jpg',
    contentType: NotificationContentType.ARTICLE,
    triggerEvent: 'article.published',
    isAutoTrigger: true,
    isActive: true,
    defaultAudience: {},
    variables: [],
    createdById: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as NotificationTemplate;

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  let repo: jest.Mocked<Repository<NotificationTemplate>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplateService,
        {
          provide: getRepositoryToken(NotificationTemplate),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationTemplateService>(
      NotificationTemplateService,
    );
    repo = module.get(getRepositoryToken(NotificationTemplate));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all templates ordered by createdAt DESC with createdBy relation', async () => {
      const templates = [
        buildTemplate({ id: 'tpl-1', createdAt: new Date('2026-02-01') }),
        buildTemplate({ id: 'tpl-2', createdAt: new Date('2026-01-01') }),
      ];
      repo.find.mockResolvedValue(templates);

      const result = await service.findAll();

      expect(result).toEqual(templates);
      expect(repo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        relations: ['createdBy'],
      });
    });
  });

  describe('findOne', () => {
    it('should return the template when found', async () => {
      const template = buildTemplate();
      repo.findOne.mockResolvedValue(template);

      const result = await service.findOne('tpl-uuid-1');

      expect(result).toEqual(template);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'tpl-uuid-1' },
        relations: ['createdBy'],
      });
    });

    it('should throw NotFoundException when template does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTriggerEvent', () => {
    it('should return only active auto-trigger templates for the given event', async () => {
      const matching = [
        buildTemplate({
          triggerEvent: 'article.published',
          isAutoTrigger: true,
          isActive: true,
        }),
      ];
      repo.find.mockResolvedValue(matching);

      const result = await service.findByTriggerEvent('article.published');

      expect(result).toEqual(matching);
      expect(repo.find).toHaveBeenCalledWith({
        where: {
          triggerEvent: 'article.published',
          isAutoTrigger: true,
          isActive: true,
        },
      });
    });
  });

  describe('create', () => {
    it('should create and save a new template', async () => {
      const dto = {
        name: 'new_template',
        titleTemplate: 'Title',
        bodyTemplate: 'Body',
        contentType: NotificationContentType.CUSTOM,
      } as any;

      const created = buildTemplate({ name: 'new_template' });

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(dto, 'user-42');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { name: 'new_template' },
      });
      expect(repo.create).toHaveBeenCalledWith({
        ...dto,
        createdById: 'user-42',
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('should throw ConflictException when name already exists', async () => {
      const dto = {
        name: 'breaking_news',
        titleTemplate: 'T',
        bodyTemplate: 'B',
        contentType: NotificationContentType.ARTICLE,
      } as any;

      repo.findOne.mockResolvedValue(buildTemplate());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a template when name is not changing', async () => {
      const existing = buildTemplate();
      const dto = { bodyTemplate: 'Updated body' } as any;

      // findOne call inside service.findOne
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, ...dto } as any);

      const result = await service.update('tpl-uuid-1', dto);

      expect(result.bodyTemplate).toBe('Updated body');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when changing to an existing name', async () => {
      const existing = buildTemplate({ name: 'original_name' });

      // First findOne is from findOne(id) — returns the template being updated
      // Second findOne is the duplicate-name check — returns a different template
      repo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(
          buildTemplate({ id: 'other-id', name: 'taken_name' }),
        );

      await expect(
        service.update('tpl-uuid-1', { name: 'taken_name' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should find and remove the template', async () => {
      const template = buildTemplate();
      repo.findOne.mockResolvedValue(template);
      repo.remove.mockResolvedValue(template);

      await service.remove('tpl-uuid-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'tpl-uuid-1' },
        relations: ['createdBy'],
      });
      expect(repo.remove).toHaveBeenCalledWith(template);
    });
  });

  describe('interpolate', () => {
    it('should replace all matched placeholders with variable values', () => {
      const result = service.interpolate('Hello {{name}}, welcome to {{app}}', {
        name: 'Ofek',
        app: 'Likud News',
      });

      expect(result).toBe('Hello Ofek, welcome to Likud News');
    });

    it('should keep unmatched placeholders intact', () => {
      const result = service.interpolate(
        '{{greeting}} {{name}}, your code is {{code}}',
        { greeting: 'Hi' },
      );

      expect(result).toBe('Hi {{name}}, your code is {{code}}');
    });
  });

  describe('resolveTemplate', () => {
    it('should interpolate title, body, and imageUrl from the template', () => {
      const template = buildTemplate({
        titleTemplate: 'Breaking: {{headline}}',
        bodyTemplate: '{{summary}} by {{author}}',
        imageUrlTemplate: 'https://cdn.example.com/{{image_key}}.jpg',
      });

      const result = service.resolveTemplate(template, {
        headline: 'Election Results',
        summary: 'Likud wins',
        author: 'Editor',
        image_key: 'abc123',
      });

      expect(result).toEqual({
        title: 'Breaking: Election Results',
        body: 'Likud wins by Editor',
        imageUrl: 'https://cdn.example.com/abc123.jpg',
      });
    });

    it('should return undefined imageUrl when template has no imageUrlTemplate', () => {
      const template = buildTemplate({
        titleTemplate: '{{title}}',
        bodyTemplate: '{{body}}',
        imageUrlTemplate: null as any,
      });

      const result = service.resolveTemplate(template, {
        title: 'Test',
        body: 'Content',
      });

      expect(result).toEqual({
        title: 'Test',
        body: 'Content',
        imageUrl: undefined,
      });
    });
  });
});
