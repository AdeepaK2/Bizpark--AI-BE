import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AgentModule],
  providers: [BusinessService],
  controllers: [BusinessController]
})
export class BusinessModule { }
