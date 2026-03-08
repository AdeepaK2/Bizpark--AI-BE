import { Test, TestingModule } from '@nestjs/testing';
import { AgentProcessor } from './agent.processor';

describe('AgentProcessor', () => {
  let provider: AgentProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentProcessor],
    }).compile();

    provider = module.get<AgentProcessor>(AgentProcessor);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
