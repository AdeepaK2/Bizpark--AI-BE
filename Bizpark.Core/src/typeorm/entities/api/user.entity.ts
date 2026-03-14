import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntityWithTimestamps } from '../shared';
import { ApiBusinessUserEntity } from './business-user.entity';

@Entity({ name: 'users' })
export class ApiUserEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    passwordHash!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @OneToMany(() => ApiBusinessUserEntity, (businessUser) => businessUser.user)
    businesses!: ApiBusinessUserEntity[];
}
