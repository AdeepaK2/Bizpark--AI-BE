import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('returns health status with correct shape', () => {
    const result = service.getHealth();
    expect(result.service).toBe('bizpark-commerce');
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('returns a valid ISO timestamp', () => {
    const result = service.getHealth();
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
