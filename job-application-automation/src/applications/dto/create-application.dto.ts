import { IsString, IsOptional, IsEnum, IsUrl, IsEmail, IsDateString } from 'class-validator';
import { ApplicationSource, ApplyMethod, ApplicationStatus } from '../entities/application.entity';

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
  @IsUrl()
  applicationUrl?: string;

  @IsOptional()
  @IsString()
  recruiterName?: string;

  @IsUrl()
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
  jobDescriptionRaw?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  applicationStatus?: ApplicationStatus;

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
}

export class JobPasteDto {
  @IsString()
  jobDescriptionRaw: string;

  @IsOptional()
  @IsUrl()
  jobUrl?: string;
}
