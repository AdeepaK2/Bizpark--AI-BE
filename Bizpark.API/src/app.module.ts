import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { BusinessModule } from './business/business.module';
import { AuthModule } from './auth/auth.module';
import { TemplateModule } from './template/template.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
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
