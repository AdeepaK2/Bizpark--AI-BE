import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserRole } from '../shared';
import { ApiBusinessEntity } from './business.entity';
import { ApiUserEntity } from './user.entity';

@Entity({ name: 'business_users' })
export class ApiBusinessUserEntity {
    @PrimaryColumn({ type: 'uuid' })
    userId!: string;

    @PrimaryColumn({ type: 'uuid' })
    businessId!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        enumName: 'business_user_role_enum',
        default: UserRole.EDITOR,
    })
    role!: UserRole;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @ManyToOne(() => ApiUserEntity, (user) => user.businesses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: ApiUserEntity;

    @ManyToOne(() => ApiBusinessEntity, (business) => business.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'businessId' })
    business!: ApiBusinessEntity;
}
