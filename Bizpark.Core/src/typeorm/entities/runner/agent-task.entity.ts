import { Column, Entity } from 'typeorm';
import { BaseEntityWithTimestamps, OrmRunnerTaskStatus, OrmRunnerTaskType } from '../shared';

@Entity({ name: 'agent_tasks' })
export class RunnerAgentTaskEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'varchar', length: 255 })
    businessId!: string;

    @Column({
        type: 'enum',
        enum: OrmRunnerTaskType,
        enumName: 'agent_task_type_enum',
    })
    taskType!: OrmRunnerTaskType;

    @Column({
        type: 'enum',
        enum: OrmRunnerTaskStatus,
        enumName: 'agent_task_status_enum',
        default: OrmRunnerTaskStatus.QUEUED,
    })
    status!: OrmRunnerTaskStatus;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    inputData!: Record<string, unknown>;

    @Column({ type: 'jsonb', nullable: true })
    outputData!: Record<string, unknown> | null;

    @Column({ type: 'text', nullable: true })
    logs!: string | null;
}
