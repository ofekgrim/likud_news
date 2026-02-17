import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactMessage } from './entities/contact-message.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
});

describe('ContactService', () => {
  let service: ContactService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: getRepositoryToken(ContactMessage),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    repository = module.get(getRepositoryToken(ContactMessage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a contact message', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '050-1234567',
        subject: 'Test Subject',
        message: 'Test message body',
      };
      const created = {
        id: 'msg-uuid',
        ...dto,
        isRead: false,
        createdAt: new Date(),
      };
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return paginated messages without isRead filter', async () => {
      const messages = [
        {
          id: 'msg-1',
          name: 'User A',
          email: 'a@test.com',
          subject: 'Sub A',
          message: 'Msg A',
          isRead: false,
          createdAt: new Date(),
        },
      ];
      repository.findAndCount.mockResolvedValue([messages, 1]);

      const result = await service.findAll(1, 20);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ data: messages, total: 1 });
    });

    it('should filter by isRead when provided', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, 10, false);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isRead: false },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should calculate correct skip for page 3', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(3, 5);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 5,
      });
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true', async () => {
      const message = {
        id: 'msg-uuid',
        name: 'User',
        email: 'user@test.com',
        subject: 'Subject',
        message: 'Body',
        isRead: false,
        createdAt: new Date(),
      } as ContactMessage;
      repository.findOne.mockResolvedValue(message);
      repository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.markAsRead('msg-uuid');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'msg-uuid' },
      });
      expect(result.isRead).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: true }),
      );
    });

    it('should throw NotFoundException when message not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
