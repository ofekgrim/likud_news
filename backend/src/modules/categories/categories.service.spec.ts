import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a category', async () => {
      const dto = {
        name: 'פוליטיקה',
        nameEn: 'Politics',
        slug: 'politics',
        sortOrder: 1,
      } as any;

      const category = { id: 'uuid-1', ...dto } as Category;

      repository.create.mockReturnValue(category);
      repository.save.mockResolvedValue(category);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(category);
      expect(result).toEqual(category);
    });
  });

  describe('findAll', () => {
    it('should return all categories sorted by sortOrder', async () => {
      const categories = [
        { id: '1', name: 'First', sortOrder: 1 },
        { id: '2', name: 'Second', sortOrder: 2 },
      ] as Category[];

      repository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual(categories);
      expect(repository.find).toHaveBeenCalledWith({
        order: { sortOrder: 'ASC' },
      });
    });
  });

  describe('findAllActive', () => {
    it('should return only active categories', async () => {
      const activeCategories = [
        { id: '1', name: 'Active', isActive: true, sortOrder: 1 },
      ] as Category[];

      repository.find.mockResolvedValue(activeCategories);

      const result = await service.findAllActive();

      expect(result).toEqual(activeCategories);
      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const category = { id: 'uuid-1', name: 'Test' } as Category;

      repository.findOne.mockResolvedValue(category);
      repository.remove.mockResolvedValue(category);

      await service.remove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.remove).toHaveBeenCalledWith(category);
    });
  });
});
