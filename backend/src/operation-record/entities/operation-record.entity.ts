import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum OperationType {
  LOGIN = 'login',
  REGISTER = 'register',
  SEARCH = 'search',
  DOWNLOAD = 'download',
  PARSE_URL = 'parse_url',
  DELETE_FILE = 'delete_file',
  VIEW_LIBRARY = 'view_library',
  VIEW_FORMATS = 'view_formats',
}

@Entity('operation_records')
export class OperationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar' })
  type: OperationType;

  @Column({ nullable: true })
  detail: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.operationRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
