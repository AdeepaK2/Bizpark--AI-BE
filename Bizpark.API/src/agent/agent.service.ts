import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateAgentTaskDto, runnerDb, TaskStatus } from 'bizpark.core';
import { randomUUID } from 'crypto';

@Injectable()
export class AgentService {
    constructor(@InjectQueue('agent-queue') private agentQueue: Queue) { }

    async queueTask(dto: CreateAgentTaskDto) {
        const taskId = randomUUID();

        // Pre-create so polling immediately finds QUEUED status (before worker picks it up)
        await runnerDb.agentTask.create({
            data: {
                id: taskId,
                businessId: dto.businessId,
                taskType: dto.taskType,
                status: TaskStatus.QUEUED,
                inputData: dto.inputData || {},
            },
        });

        await this.agentQueue.add('agent-job', { ...dto, taskId });

        return {
            success: true,
            message: 'Agent task has been queued.',
            taskId,
            status: 'queued',
        };
    }
}
