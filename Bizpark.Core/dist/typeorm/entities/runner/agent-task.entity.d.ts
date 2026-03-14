import { BaseEntityWithTimestamps, OrmRunnerTaskStatus, OrmRunnerTaskType } from '../shared';
export declare class RunnerAgentTaskEntity extends BaseEntityWithTimestamps {
    businessId: string;
    taskType: OrmRunnerTaskType;
    status: OrmRunnerTaskStatus;
    inputData: Record<string, unknown>;
    outputData: Record<string, unknown> | null;
    logs: string | null;
}
