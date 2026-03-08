import { TaskType } from '@prisma/client';
export declare class CreateAgentTaskDto {
    businessId: string;
    taskType: TaskType;
    inputData: any;
}
