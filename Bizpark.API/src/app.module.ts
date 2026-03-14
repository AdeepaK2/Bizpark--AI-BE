import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { BusinessModule } from './business/business.module';
import { AuthModule } from './auth/auth.module';
import { TemplateModule } from './template/template.module';

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
    TemplateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
