import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentProcessor } from './agent.processor/agent.processor';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT || 6379);

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisHost,
        port: Number.isNaN(redisPort) ? 6379 : redisPort,
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
