import { Column, Entity } from 'typeorm';
import { BaseEntityWithTimestamps, TaskStatus, TaskType } from '../shared';

@Entity({ name: 'AgentTask' })
export class RunnerAgentTaskEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'varchar', length: 255 })
    businessId!: string;

    @Column({
        type: 'enum',
        enum: TaskType,
        enumName: 'TaskType',
    })
    taskType!: TaskType;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        enumName: 'TaskStatus',
        default: TaskStatus.QUEUED,
    })
    status!: TaskStatus;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    inputData!: unknown;

    @Column({ type: 'jsonb', nullable: true })
    outputData!: unknown;

    @Column({ type: 'text', nullable: true })
    logs!: string | null;
}
