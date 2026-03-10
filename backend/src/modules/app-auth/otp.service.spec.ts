import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { OtpCode, OtpPurpose } from './entities/otp-code.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-code'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

describe('OtpService', () => {
  let service: OtpService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: getRepositoryToken(OtpCode), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    repository = module.get(getRepositoryToken(OtpCode));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should invalidate existing unused OTPs before generating a new one', async () => {
      const otp = { id: 'otp-uuid', identifier: '+972501234567', codeHash: 'hashed-code' } as OtpCode;
      repository.update.mockResolvedValue({ affected: 1 });
      repository.create.mockReturnValue(otp);
      repository.save.mockResolvedValue(otp);

      await service.generateOtp('+972501234567', OtpPurpose.LOGIN);

      expect(repository.update).toHaveBeenCalledWith(
        { identifier: '+972501234567', purpose: OtpPurpose.LOGIN, isUsed: false },
        { isUsed: true },
      );
    });

    it('should generate a 6-digit code string', async () => {
      const otp = { id: 'otp-uuid', identifier: '+972501234567', codeHash: 'hashed-code' } as OtpCode;
      repository.update.mockResolvedValue({ affected: 0 });
      repository.create.mockReturnValue(otp);
      repository.save.mockResolvedValue(otp);

      const code = await service.generateOtp('+972501234567');

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should hash the code with bcrypt and create OTP entity', async () => {
      const otp = { id: 'otp-uuid', identifier: '+972501234567', codeHash: 'hashed-code' } as OtpCode;
      repository.update.mockResolvedValue({ affected: 0 });
      repository.create.mockReturnValue(otp);
      repository.save.mockResolvedValue(otp);

      await service.generateOtp('+972501234567', OtpPurpose.VERIFY);

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.stringMatching(/^\d{6}$/), 10);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '+972501234567',
          codeHash: 'hashed-code',
          purpose: OtpPurpose.VERIFY,
          expiresAt: expect.any(Date),
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(otp);
    });

    it('should default to LOGIN purpose when not specified', async () => {
      const otp = { id: 'otp-uuid', identifier: '+972501234567', codeHash: 'hashed-code' } as OtpCode;
      repository.update.mockResolvedValue({ affected: 0 });
      repository.create.mockReturnValue(otp);
      repository.save.mockResolvedValue(otp);

      await service.generateOtp('+972501234567');

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: OtpPurpose.LOGIN }),
        { isUsed: true },
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: OtpPurpose.LOGIN }),
      );
    });

    it('should set expiresAt to approximately 5 minutes in the future', async () => {
      const otp = { id: 'otp-uuid', identifier: '+972501234567', codeHash: 'hashed-code' } as OtpCode;
      repository.update.mockResolvedValue({ affected: 0 });
      repository.create.mockReturnValue(otp);
      repository.save.mockResolvedValue(otp);

      const before = new Date();
      await service.generateOtp('+972501234567');
      const after = new Date();

      const createCall = repository.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt as Date;

      // expiresAt should be ~5 minutes in the future
      const fiveMinMs = 5 * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime() + fiveMinMs - 1000);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after.getTime() + fiveMinMs + 1000);
    });
  });

  describe('verifyOtp', () => {
    const phone = '+972501234567';
    const code = '123456';

    it('should return true for a valid OTP code', async () => {
      const otp = {
        id: 'otp-uuid',
        identifier: phone,
        codeHash: 'hashed-code',
        purpose: OtpPurpose.LOGIN,
        attempts: 0,
        isUsed: false,
      } as OtpCode;

      repository.findOne.mockResolvedValue(otp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repository.save.mockResolvedValue({ ...otp, isUsed: true });

      const result = await service.verifyOtp(phone, code);

      expect(result).toBe(true);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          identifier: phone,
          purpose: OtpPurpose.LOGIN,
          isUsed: false,
          expiresAt: expect.anything(),
        },
        order: { createdAt: 'DESC' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(code, 'hashed-code');
      expect(otp.isUsed).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(otp);
    });

    it('should return false for an invalid OTP code and increment attempts', async () => {
      const otp = {
        id: 'otp-uuid',
        identifier: phone,
        codeHash: 'hashed-code',
        purpose: OtpPurpose.LOGIN,
        attempts: 0,
        isUsed: false,
      } as OtpCode;

      repository.findOne.mockResolvedValue(otp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      repository.save.mockResolvedValue({ ...otp, attempts: 1 });

      const result = await service.verifyOtp(phone, '999999');

      expect(result).toBe(false);
      expect(otp.attempts).toBe(1);
      expect(otp.isUsed).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(otp);
    });

    it('should return false when no OTP is found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.verifyOtp(phone, code);

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should return false and mark OTP as used when max attempts reached', async () => {
      const otp = {
        id: 'otp-uuid',
        identifier: phone,
        codeHash: 'hashed-code',
        purpose: OtpPurpose.LOGIN,
        attempts: 3,
        isUsed: false,
      } as OtpCode;

      repository.findOne.mockResolvedValue(otp);
      repository.save.mockResolvedValue({ ...otp, isUsed: true });

      const result = await service.verifyOtp(phone, code);

      expect(result).toBe(false);
      expect(otp.isUsed).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(otp);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should use VERIFY purpose when specified', async () => {
      repository.findOne.mockResolvedValue(null);

      await service.verifyOtp(phone, code, OtpPurpose.VERIFY);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          purpose: OtpPurpose.VERIFY,
        }),
        order: { createdAt: 'DESC' },
      });
    });

    it('should increment attempts from existing count on wrong code', async () => {
      const otp = {
        id: 'otp-uuid',
        identifier: phone,
        codeHash: 'hashed-code',
        purpose: OtpPurpose.LOGIN,
        attempts: 2,
        isUsed: false,
      } as OtpCode;

      repository.findOne.mockResolvedValue(otp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      repository.save.mockResolvedValue({ ...otp, attempts: 3 });

      const result = await service.verifyOtp(phone, '000000');

      expect(result).toBe(false);
      expect(otp.attempts).toBe(3);
      expect(repository.save).toHaveBeenCalledWith(otp);
    });
  });
});
