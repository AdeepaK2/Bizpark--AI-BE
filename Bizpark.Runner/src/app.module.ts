import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentProcessor } from './agent.processor/agent.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'agent-queue',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AgentProcessor],
})
export class AppModule { }
