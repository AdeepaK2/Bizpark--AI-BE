import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminTemplateModule } from './template/admin-template.module';

@Module({
  imports: [AdminTemplateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
