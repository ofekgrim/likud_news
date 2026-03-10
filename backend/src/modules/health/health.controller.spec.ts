import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: dataSource }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok when database is connected', async () => {
    dataSource.query!.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('connected');
    expect(result.timestamp).toBeDefined();
    expect(result.uptime).toBeGreaterThan(0);
  });

  it('returns degraded when database is down', async () => {
    dataSource.query!.mockRejectedValue(new Error('Connection refused'));

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('disconnected');
  });
});
