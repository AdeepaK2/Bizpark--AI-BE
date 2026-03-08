import { TaskType, TaskStatus } from '@prisma/client';

export class CreateAgentTaskDto {
    businessId!: string;
    taskType!: TaskType;
    inputData!: any;
}
