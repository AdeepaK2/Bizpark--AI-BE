import { Controller, Post, Body, Get, Param, BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { runnerDb, CreateAgentTaskDto } from 'bizpark.core';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/agents')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post('tasks')
    async queueTask(@Body() body: CreateAgentTaskDto) {
        return this.agentService.queueTask(body);
    }

    @Get('tasks/:taskId')
    async getTaskStatus(@Param('taskId') taskId: string): Promise<any> {
        const task = await runnerDb.agentTask.findUnique({ where: { id: taskId } });
        return { success: true, data: task };
    }

    @Get('tasks')
    async getAllTasks(): Promise<any> {
        return runnerDb.agentTask.findMany({ orderBy: { createdAt: 'desc' } });
    }

    @Post('tasks/:taskId/approve')
    @UseGuards(JwtAuthGuard)
    async approveTask(
        @Param('taskId') taskId: string,
        @Body() body: { content: Record<string, any> }
    ): Promise<any> {
        const task = await runnerDb.agentTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');

        const content = body.content;
        const commerceUrl = process.env.COMMERCE_URL || 'http://localhost:3003';
        const internalKey = process.env.INTERNAL_API_KEY || '';

        const resp = await fetch(`${commerceUrl}/api/commerce/website-config`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': task.businessId,
                'x-internal-key': internalKey,
            },
            body: JSON.stringify(content),
        });

        if (!resp.ok) {
            throw new BadRequestException(`Commerce update failed: ${resp.status}`);
        }

        await runnerDb.agentTask.update({
            where: { id: taskId },
            data: { status: 'COMPLETED', outputData: { approvedContent: content } },
        });

        return { success: true, message: 'Website published successfully' };
    }

    @Post('tasks/:taskId/reject')
    @UseGuards(JwtAuthGuard)
    async rejectTask(@Param('taskId') taskId: string): Promise<any> {
        const task = await runnerDb.agentTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');

        await runnerDb.agentTask.update({
            where: { id: taskId },
            data: { status: 'FAILED', outputData: { reason: 'Rejected by user' } },
        });

        return { success: true, message: 'Task rejected' };
    }
}
