import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(),
  update: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: 'uuid-1', email: 'user1@example.com', name: 'User 1' },
        { id: 'uuid-2', email: 'user2@example.com', name: 'User 2' },
      ] as User[];

      repository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return null when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'nobody@example.com' },
      });
    });
  });

  describe('createUser', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
      role: UserRole.EDITOR,
    };

    it('should hash password and save user', async () => {
      const savedUser = {
        id: 'uuid-1',
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed_password',
        role: createUserDto.role,
      } as User;

      repository.findOne.mockResolvedValue(null); // findByEmail returns null
      repository.create.mockReturnValue(savedUser);
      repository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(repository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: 'hashed_password',
        role: createUserDto.role,
      });
      expect(repository.save).toHaveBeenCalledWith(savedUser);
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw ConflictException on duplicate email', async () => {
      const existingUser = {
        id: 'uuid-existing',
        email: createUserDto.email,
      } as User;

      repository.findOne.mockResolvedValue(existingUser); // findByEmail returns a user

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
