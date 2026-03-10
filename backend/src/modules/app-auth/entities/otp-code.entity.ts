import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OtpPurpose {
  LOGIN = 'login',
  VERIFY = 'verify',
  PHONE_CHANGE = 'phone_change',
  EMAIL_CHANGE = 'email_change',
}

@Entity('otp_codes')
@Index('idx_otp_codes_identifier', ['identifier', 'purpose', 'isUsed'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  identifier: string;

  @Column({ type: 'varchar', length: 500 })
  codeHash: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
    default: OtpPurpose.LOGIN,
  })
  purpose: OtpPurpose;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
