import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { runnerPrisma, TaskStatus } from 'bizpark.core';

@Processor('agent-queue')
export class AgentProcessor extends WorkerHost {
    private readonly logger = new Logger(AgentProcessor.name);

    async process(job: Job<any, any, string>): Promise<any> {
        const { taskId, businessId, taskType, inputData } = job.data;
        this.logger.log(`[AGENT START] BullMQ Task ${taskId} [${taskType}]: Processing agent task for business ${businessId}...`);

        // Create the generic task in the database
        await runnerPrisma.agentTask.create({
            data: {
                id: taskId,
                businessId,
                taskType,
                status: TaskStatus.PROCESSING,
                inputData: inputData || {},
            }
        });

        // Simulate long-running Genkit flow
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Update the task to completed
        await runnerPrisma.agentTask.update({
            where: { id: taskId },
            data: { status: TaskStatus.COMPLETED, outputData: { generatedContent: 'Genkit Mock Response' } }
        });

        this.logger.log(`[AGENT SUCCESS] Task ${taskId}: Content generated! Saved to PostgreSQL AgentTask table.`);

        return { success: true };
    }
}
