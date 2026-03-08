import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'agent-queue',
        }),
    ],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService, BullModule],
})
export class AgentModule { }
