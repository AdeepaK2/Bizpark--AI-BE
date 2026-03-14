import { BaseEntityWithTimestamps, TaskStatus, TaskType } from '../shared';
export declare class RunnerAgentTaskEntity extends BaseEntityWithTimestamps {
    businessId: string;
    taskType: TaskType;
    status: TaskStatus;
    inputData: unknown;
    outputData: unknown;
    logs: string | null;
}
