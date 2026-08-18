import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  EXTRACTION_PROMPT,
  CATEGORIZATION_PROMPT,
  EMAIL_GENERATION_PROMPT,
  SUBJECT_LINE_PROMPT,
  CV_MATCHING_PROMPT,
} from './prompts';

// --- Interfaces ---

export interface ExtractedJobData {
  company: string;
  jobTitle: string;
  location: string;
  workMode: string;
  employmentType: string;
  recipientEmail: string;
  recruiterName: string;
  requiredSkills: string;
  experienceLevel: string;
  salaryRange: string;
  applicationUrl: string | null;
  summary: string;
}

export interface JobCategorization {
  categories: string[];
  primaryCategory: string;
}

export interface CvMatchResult {
  confidence: number;
  matchingSkills: string[];
  missingSkills: string[];
  reasoning: string;
  recommendation: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

// --- Service ---

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private modelName: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.modelName = this.configService.get<string>('AI_MODEL') || 'google/gemini-2.0-flash:free';
    
    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not set — AI features will be unavailable');
      return;
    }

    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });
    
    this.logger.log(`OpenRouter AI service initialized (model: ${this.modelName})`);
  }

  /**
   * Extract structured job data from raw job description text.
   */
  async extractJobDetails(jobDescriptionRaw: string): Promise<ExtractedJobData> {
    const prompt = EXTRACTION_PROMPT.replace('{JOB_TEXT}', jobDescriptionRaw);
    const result = await this.callAI(prompt);
    return this.parseJson<ExtractedJobData>(result, {
      company: 'Unknown',
      jobTitle: 'Unknown',
      location: 'Unknown',
      workMode: 'Unknown',
      employmentType: 'Unknown',
      recipientEmail: 'Unknown',
      recruiterName: 'Unknown',
      requiredSkills: '',
      experienceLevel: 'Unknown',
      salaryRange: 'Unknown',
      applicationUrl: null,
      summary: '',
    });
  }

  /**
   * Categorize a job into one or more categories.
   */
  async categorizeJob(
    jobTitle: string,
    jobSummary: string,
    requiredSkills: string,
  ): Promise<JobCategorization> {
    const prompt = CATEGORIZATION_PROMPT
      .replace('{JOB_TITLE}', jobTitle)
      .replace('{JOB_SUMMARY}', jobSummary)
      .replace('{REQUIRED_SKILLS}', requiredSkills);

    const result = await this.callAI(prompt);
    return this.parseJson<JobCategorization>(result, {
      categories: ['Other'],
      primaryCategory: 'Other',
    });
  }

  /**
   * Generate a personalized application email.
   */
  async generateEmail(
    jobData: {
      company: string;
      jobTitle: string;
      requiredSkills: string;
      summary: string;
    },
    cvData: {
      skills: string;
      experience: string;
      targetRoles: string;
    },
    candidateName: string,
  ): Promise<GeneratedEmail> {
    // Generate body
    const bodyPrompt = EMAIL_GENERATION_PROMPT
      .replace('{CV_SKILLS}', cvData.skills)
      .replace('{CV_EXPERIENCE}', cvData.experience || 'Not specified')
      .replace('{CV_TARGET_ROLES}', cvData.targetRoles || 'Software Development')
      .replace('{COMPANY}', jobData.company)
      .replace('{JOB_TITLE}', jobData.jobTitle)
      .replace('{REQUIRED_SKILLS}', jobData.requiredSkills)
      .replace('{JOB_SUMMARY}', jobData.summary);

    const body = await this.callAI(bodyPrompt);

    // Generate subject
    const subjectPrompt = SUBJECT_LINE_PROMPT
      .replace('{COMPANY}', jobData.company)
      .replace('{JOB_TITLE}', jobData.jobTitle)
      .replace('{CANDIDATE_NAME}', candidateName);

    const subject = await this.callAI(subjectPrompt);

    return {
      subject: subject.trim(),
      body: body.trim(),
    };
  }

  /**
   * AI-powered CV matching — semantic comparison of CV vs job requirements.
   */
  async matchCv(
    jobData: {
      jobTitle: string;
      requiredSkills: string;
      experienceLevel: string;
      jobDescription: string;
    },
    cvData: {
      skills: string;
      experience: string;
      education: string;
      yearsOfExperience: string;
      targetRoles: string;
    },
  ): Promise<CvMatchResult> {
    const prompt = CV_MATCHING_PROMPT
      .replace('{JOB_TITLE}', jobData.jobTitle)
      .replace('{REQUIRED_SKILLS}', jobData.requiredSkills)
      .replace('{EXPERIENCE_LEVEL}', jobData.experienceLevel)
      .replace('{JOB_DESCRIPTION}', jobData.jobDescription.substring(0, 2000)) // Limit length
      .replace('{CV_SKILLS}', cvData.skills)
      .replace('{CV_EXPERIENCE}', cvData.experience || 'Not specified')
      .replace('{CV_EDUCATION}', cvData.education || 'Not specified')
      .replace('{CV_YEARS}', cvData.yearsOfExperience || 'Unknown')
      .replace('{CV_TARGET_ROLES}', cvData.targetRoles || 'Not specified');

    const result = await this.callAI(prompt);
    return this.parseJson<CvMatchResult>(result, {
      confidence: 0,
      matchingSkills: [],
      missingSkills: [],
      reasoning: 'AI matching unavailable',
      recommendation: 'weak_match',
    });
  }

  // --- Internal helpers ---

  /**
   * Call AI API (OpenRouter) with error handling and retry.
   */
  private async callAI(prompt: string, retries = 2): Promise<string> {
    if (!this.openai) {
      throw new Error('AI service not initialized — OPENROUTER_API_KEY may be missing');
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`AI API call (attempt ${attempt + 1}/${retries + 1})`);
        
        const response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
        });

        const text = response.choices[0]?.message?.content;

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI');
        }

        this.logger.debug(`AI response received (${text.length} chars)`);
        return text;
      } catch (error: any) {
        this.logger.error(`AI API error (attempt ${attempt + 1}): ${error.message}`);

        if (attempt === retries) {
          throw new Error(`AI service failed after ${retries + 1} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('AI service: unexpected code path');
  }

  /**
   * Parse JSON from AI response with fallback defaults.
   * Handles markdown code fences, extra text, etc.
   */
  private parseJson<T>(text: string, fallback: T): T {
    try {
      // Strip markdown code fences if present
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      // Try to find JSON object in the text
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleaned);
      return { ...fallback, ...parsed };
    } catch (error) {
      this.logger.warn(`Failed to parse AI JSON response: ${error}. Using fallback.`);
      this.logger.debug(`Raw AI response was: ${text.substring(0, 200)}`);
      return fallback;
    }
  }

  /**
   * Check if the AI service is available.
   */
  isAvailable(): boolean {
    return !!this.openai;
  }
}
