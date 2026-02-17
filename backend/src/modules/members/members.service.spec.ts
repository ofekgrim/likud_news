import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { Member } from './entities/member.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

describe('MembersService', () => {
  let service: MembersService;
  let repository: ReturnType<typeof mockRepository>;

  const mockMember: Partial<Member> = {
    id: 'uuid-1',
    name: 'בנימין נתניהו',
    nameEn: 'Benjamin Netanyahu',
    title: 'ראש הממשלה',
    bio: 'ראש ממשלת ישראל',
    photoUrl: 'https://cdn.example.com/photo.jpg',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(Member),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    repository = module.get(getRepositoryToken(Member));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a member', async () => {
      const dto = {
        name: 'בנימין נתניהו',
        nameEn: 'Benjamin Netanyahu',
        title: 'ראש הממשלה',
      };

      repository.create.mockReturnValue(mockMember);
      repository.save.mockResolvedValue(mockMember);

      const result = await service.create(dto as any);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockMember);
      expect(result).toEqual(mockMember);
    });
  });

  describe('findAll', () => {
    it('should return all members sorted by sortOrder', async () => {
      const members = [mockMember, { ...mockMember, id: 'uuid-2', sortOrder: 2 }];
      repository.find.mockResolvedValue(members);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { sortOrder: 'ASC' },
      });
      expect(result).toEqual(members);
    });
  });

  describe('findAllActive', () => {
    it('should return only active members sorted by sortOrder', async () => {
      const activeMembers = [mockMember];
      repository.find.mockResolvedValue(activeMembers);

      const result = await service.findAllActive();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC' },
      });
      expect(result).toEqual(activeMembers);
    });
  });

  describe('findOne', () => {
    it('should return a member by id', async () => {
      repository.findOne.mockResolvedValue(mockMember);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(mockMember);
    });

    it('should throw NotFoundException when member not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findWithArticles', () => {
    it('should return member with articles relation', async () => {
      const memberWithArticles = { ...mockMember, articles: [] };
      repository.findOne.mockResolvedValue(memberWithArticles);

      const result = await service.findWithArticles('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: ['articles'],
      });
      expect(result).toEqual(memberWithArticles);
    });

    it('should throw NotFoundException when member not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findWithArticles('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
