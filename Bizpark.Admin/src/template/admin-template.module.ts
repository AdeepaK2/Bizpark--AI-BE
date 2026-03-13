import { Module } from '@nestjs/common';
import { AdminTemplateController } from './admin-template.controller';
import { AdminTemplateService } from './admin-template.service';

@Module({
  controllers: [AdminTemplateController],
  providers: [AdminTemplateService],
})
export class AdminTemplateModule {}

