import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentModule } from './agent/agent.module';
import { BusinessModule } from './business/business.module';
import { AuthModule } from './auth/auth.module';

/**
 * Redis connection config.
 * - Production / Upstash / Railway: set REDIS_URL (e.g. rediss://...)
 * - Local dev: set REDIS_HOST + REDIS_PORT (defaults: localhost:6379)
 */
function buildRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    // BullMQ accepts a connection string directly
    return { url: redisUrl };
  }
  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT || 6379);
  return { host, port: Number.isNaN(port) ? 6379 : port };
}

@Module({
  imports: [
    BullModule.forRoot({
      connection: buildRedisConnection(),
    }),
    AgentModule,
    BusinessModule,
    AuthModule,
  ],
})
export class AppModule { }
