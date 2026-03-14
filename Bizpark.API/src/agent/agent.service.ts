import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateAgentTaskDto } from 'bizpark.core';
import { randomUUID } from 'crypto';

@Injectable()
export class AgentService {
    constructor(@InjectQueue('agent-queue') private agentQueue: Queue) { }

    async queueTask(dto: CreateAgentTaskDto) {
        const taskId = randomUUID();
        await this.agentQueue.add('agent-job', {
            ...dto,
            taskId,
        });

        return {
            success: true,
            message: `Agent task has been queued.`,
            taskId,
            status: 'queued'
        };
    }
}
