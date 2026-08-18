import { IsString, IsOptional, IsEnum, IsUrl, IsEmail, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApplicationSource, ApplyMethod, ApplicationStatus, ReviewStatus, EmailStatus } from '../entities/application.entity';

export class CreateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationSource)
  source?: ApplicationSource;

  @IsOptional()
  @IsEnum(ApplyMethod)
  applyMethod?: ApplyMethod;

  @IsString()
  company: string;

  @IsString()
  jobTitle: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  workMode?: string;

  @IsOptional()
  @IsString()
  employmentType?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  applicationUrl?: string;

  @IsOptional()
  @IsString()
  recruiterName?: string;

  @IsString()
  jobUrl: string;

  @IsString()
  jobDescription: string;

  @IsOptional()
  @IsString()
  requiredSkills?: string;

  @IsOptional()
  @IsString()
  jobCategory?: string;

  @IsOptional()
  @IsString()
  selectedCv?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cvMatchConfidence?: number;

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailBody?: string;

  @IsOptional()
  @IsString()
  aiExtractionRaw?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  applicationStatus?: ApplicationStatus;

  @IsOptional()
  @IsEnum(ReviewStatus)
  reviewStatus?: ReviewStatus;

  @IsOptional()
  @IsEnum(EmailStatus)
  emailStatus?: EmailStatus;

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailBody?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  selectedCv?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cvMatchConfidence?: number;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  screenshotPath?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  workMode?: string;

  @IsOptional()
  @IsString()
  employmentType?: string;

  @IsOptional()
  @IsString()
  recruiterName?: string;

  @IsOptional()
  @IsString()
  jobCategory?: string;

  @IsOptional()
  @IsString()
  requiredSkills?: string;
}

export class JobPasteDto {
  @IsString()
  jobDescriptionRaw: string;

  @IsOptional()
  @IsString()
  jobUrl?: string;
}
