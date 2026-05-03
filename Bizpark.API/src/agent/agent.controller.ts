import { Controller, Post, Body, Get, Param, BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { runnerDb, CreateAgentTaskDto } from 'bizpark.core';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { randomBytes } from 'node:crypto';

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
        @Body() body: { content: Record<string, any> },
        @CurrentUser() currentUser: { id: string; email: string; name: string },
    ): Promise<any> {
        const task = await runnerDb.agentTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');

        // Use explicitly provided content, or fall back to what the AI generated
        const taskOutput = task.outputData as Record<string, any> | null;
        const content = body.content ?? taskOutput?.generatedContent;
        if (!content) throw new BadRequestException('No content to publish — task has no generated output');

        const commerceUrl = process.env.COMMERCE_URL || 'http://localhost:3003';
        const internalKey = process.env.INTERNAL_API_KEY || '';

        // 1. Push website config to Commerce
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

        // Bootstrap fire-and-forget — if business creation already ran it this returns 409 (fine).
        // Frontend uses localStorage credentials from business creation as the source of truth.
        const adminPassword = 'Biz-' + randomBytes(4).toString('hex');
        void fetch(`${commerceUrl}/api/commerce/auth/bootstrap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': task.businessId },
            body: JSON.stringify({ email: currentUser.email, password: adminPassword, name: currentUser.name }),
        }).catch(() => { /* non-critical */ });

        return { success: true, message: 'Website published successfully', adminCredentials: null };
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
