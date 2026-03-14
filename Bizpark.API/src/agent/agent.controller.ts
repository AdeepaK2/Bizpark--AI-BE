import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { AgentService } from './agent.service';
import { runnerDb, CreateAgentTaskDto } from 'bizpark.core';

@Controller('api/agents')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post('tasks')
    async queueTask(@Body() body: CreateAgentTaskDto) {
        return this.agentService.queueTask(body);
    }

    @Get('tasks/:taskId')
    async getTaskStatus(@Param('taskId') taskId: string): Promise<any> {
        const task = await runnerDb.agentTask.findUnique({
            where: { id: taskId }
        });
        return {
            success: true,
            data: task
        };
    }

    @Get('tasks')
    async getAllTasks(): Promise<any> {
        return runnerDb.agentTask.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}
