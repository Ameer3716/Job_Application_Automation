import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ApplicationSource {
  MANUAL_PASTE = 'manual_paste',
  DISCOVERY_SCRAPED = 'discovery_scraped',
  COLD_OUTREACH = 'cold_outreach',
}

export enum ApplyMethod {
  EMAIL = 'email',
  FORM_AUTOMATION = 'form_automation',
  MANUAL = 'manual',
}

export enum ApplicationStatus {
  APPLIED = 'Applied',
  EMAIL_SENT = 'Email Sent',
  RESPONSE = 'Response',
  INTERVIEW = 'Interview',
  TEST = 'Test',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  NO_RESPONSE = 'No Response',
  WITHDRAWN = 'Withdrawn',
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  OPENED = 'opened',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'date_applied' })
  dateApplied: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: ApplicationSource,
    default: ApplicationSource.MANUAL_PASTE,
  })
  source: ApplicationSource;

  @Column({
    type: 'enum',
    enum: ApplyMethod,
    default: ApplyMethod.EMAIL,
  })
  applyMethod: ApplyMethod;

  @Column({ type: 'varchar', length: 255 })
  company: string;

  @Column({ type: 'varchar', length: 255 })
  jobTitle: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  workMode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employmentType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  applicationUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recruiterName: string;

  @Column({ type: 'varchar', length: 500 })
  jobUrl: string;

  @Column({ type: 'text' })
  jobDescription: string;

  @Column({ type: 'text', nullable: true })
  requiredSkills: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  jobCategory: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  selectedCv: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cvMatchConfidence: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  emailSubject: string;

  @Column({ type: 'text', nullable: true })
  emailBody: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
    nullable: true,
  })
  emailStatus: EmailStatus;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  applicationStatus: ApplicationStatus;

  @Column({ type: 'timestamp', nullable: true })
  followUpDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  screenshotPath: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
