import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentModule } from './agent/agent.module';
import { BusinessModule } from './business/business.module';
import { AuthModule } from './auth/auth.module';
import { GoogleBusinessModule } from './google-business/google-business.module';

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
    AgentModule,
    BusinessModule,
    AuthModule,
    GoogleBusinessModule,
  ],
})
export class AppModule { }
