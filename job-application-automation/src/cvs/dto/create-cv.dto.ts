import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCvDto {
  @IsString()
  fileName: string;

  @IsString()
  filePath: string;

  @IsString()
  skills: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  yearsOfExperience?: string;

  @IsOptional()
  @IsString()
  targetRoles?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class UpdateCvDto {
  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  yearsOfExperience?: string;

  @IsOptional()
  @IsString()
  targetRoles?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  metadata?: string;
}
