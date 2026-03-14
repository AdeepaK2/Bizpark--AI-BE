import { TaskType } from '../../typeorm/entities/shared/enums';
export declare class CreateAgentTaskDto {
    businessId: string;
    taskType: TaskType;
    inputData: any;
}
