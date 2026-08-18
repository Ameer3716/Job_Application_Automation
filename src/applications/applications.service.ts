import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ReviewStatus } from './entities/application.entity';
import { CreateApplicationDto, UpdateApplicationDto, JobPasteDto } from './dto/create-application.dto';
import { AiService } from '../ai/ai.service';
import { CvsService } from '../cvs/cvs.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    private readonly aiService: AiService,
    private readonly cvsService: CvsService,
  ) {}

  async create(createApplicationDto: CreateApplicationDto): Promise<Application> {
    const application = this.applicationsRepository.create(createApplicationDto);
    return await this.applicationsRepository.save(application);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Application[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.applicationsRepository.findAndCount({
      order: { dateApplied: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.applicationsRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto): Promise<Application> {
    const application = await this.findOne(id);
    Object.assign(application, updateApplicationDto);
    return await this.applicationsRepository.save(application);
  }

  async remove(id: string): Promise<void> {
    const application = await this.findOne(id);
    await this.applicationsRepository.remove(application);
  }

  async findByCompany(company: string): Promise<Application[]> {
    return await this.applicationsRepository.find({
      where: { company },
      order: { dateApplied: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Application[]> {
    return await this.applicationsRepository.find({
      where: { applicationStatus: status as any },
      order: { dateApplied: 'DESC' },
    });
  }

  /**
   * Process a pasted job description using AI extraction.
   * This is the core pipeline: paste → extract → categorize → match CV → generate email.
   */
  async processJobPaste(jobPasteDto: JobPasteDto): Promise<any> {
    this.logger.log('Processing job paste — starting AI extraction pipeline');

    // Check if AI is available
    if (!this.aiService.isAvailable()) {
      this.logger.warn('AI service unavailable — returning raw paste data');
      return {
        extractedData: null,
        rawText: jobPasteDto.jobDescriptionRaw,
        message: 'AI service unavailable. Please configure GEMINI_API_KEY.',
        pipelineStatus: 'ai_unavailable',
      };
    }

    try {
      // Step 1: AI Extraction
      this.logger.log('Step 1/4: Extracting job details with AI...');
      const extracted = await this.aiService.extractJobDetails(jobPasteDto.jobDescriptionRaw);

      // Step 2: Categorization
      this.logger.log('Step 2/4: Categorizing job...');
      const categorization = await this.aiService.categorizeJob(
        extracted.jobTitle,
        extracted.summary,
        extracted.requiredSkills,
      );

      // Step 3: CV Matching
      this.logger.log('Step 3/4: Matching CVs...');
      let cvMatch: any = null;
      try {
        const activeCvs = await this.cvsService.findAll();
        if (activeCvs.length > 0) {
          // Match against each active CV using AI
          let bestMatch: any = { cv: activeCvs[0], confidence: 0, reasoning: '', recommendation: 'weak_match' };

          for (const cv of activeCvs) {
            const matchResult = await this.aiService.matchCv(
              {
                jobTitle: extracted.jobTitle,
                requiredSkills: extracted.requiredSkills,
                experienceLevel: extracted.experienceLevel,
                jobDescription: jobPasteDto.jobDescriptionRaw.substring(0, 2000),
              },
              {
                skills: cv.skills,
                experience: cv.experience || '',
                education: cv.education || '',
                yearsOfExperience: cv.yearsOfExperience || '',
                targetRoles: cv.targetRoles || '',
              },
            );

            if (matchResult.confidence > bestMatch.confidence) {
              bestMatch = { cv, ...matchResult };
            }
          }

          cvMatch = bestMatch;
        }
      } catch (cvError: any) {
        this.logger.warn(`CV matching failed: ${cvError.message}`);
      }

      // Step 4: Email Generation
      this.logger.log('Step 4/4: Generating application email...');
      let generatedEmail: any = null;
      try {
        if (cvMatch?.cv) {
          generatedEmail = await this.aiService.generateEmail(
            {
              company: extracted.company,
              jobTitle: extracted.jobTitle,
              requiredSkills: extracted.requiredSkills,
              summary: extracted.summary,
            },
            {
              skills: cvMatch.cv.skills,
              experience: cvMatch.cv.experience || '',
              targetRoles: cvMatch.cv.targetRoles || '',
            },
            'Ameer Sultan', // TODO: Get from user profile
          );
        }
      } catch (emailError: any) {
        this.logger.warn(`Email generation failed: ${emailError.message}`);
      }

      // Check for duplicates
      const duplicate = await this.checkDuplicate(
        extracted.company,
        extracted.jobTitle,
        jobPasteDto.jobUrl || '',
      );

      // Create draft application record
      const applicationData: Partial<Application> = {
        company: extracted.company,
        jobTitle: extracted.jobTitle,
        location: extracted.location,
        workMode: extracted.workMode,
        employmentType: extracted.employmentType,
        recipientEmail: extracted.recipientEmail !== 'Unknown' ? extracted.recipientEmail : undefined,
        applicationUrl: extracted.applicationUrl || undefined,
        recruiterName: extracted.recruiterName !== 'Unknown' ? extracted.recruiterName : undefined,
        jobUrl: jobPasteDto.jobUrl || '',
        jobDescription: jobPasteDto.jobDescriptionRaw,
        requiredSkills: extracted.requiredSkills,
        jobCategory: categorization.categories.join(', '),
        selectedCv: cvMatch?.cv?.fileName || undefined,
        cvMatchConfidence: cvMatch?.confidence || undefined,
        emailSubject: generatedEmail?.subject || undefined,
        emailBody: generatedEmail?.body || undefined,
        aiExtractionRaw: JSON.stringify({ extracted, categorization, cvMatch: cvMatch ? { confidence: cvMatch.confidence, reasoning: cvMatch.reasoning } : undefined }),
        reviewStatus: ReviewStatus.DRAFT,
      };

      let savedApplication: Application | null = null;
      if (!duplicate) {
        const application = this.applicationsRepository.create(applicationData);
        savedApplication = await this.applicationsRepository.save(application);
        this.logger.log(`Application created as draft: ${savedApplication.id}`);
      }

      return {
        extractedData: extracted,
        categorization,
        cvMatch: cvMatch ? {
          cvName: cvMatch.cv?.fileName,
          confidence: cvMatch.confidence,
          reasoning: cvMatch.reasoning,
          recommendation: cvMatch.recommendation,
        } : null,
        generatedEmail,
        duplicate: duplicate ? { id: duplicate.id, company: duplicate.company, jobTitle: duplicate.jobTitle } : null,
        application: savedApplication,
        pipelineStatus: duplicate ? 'duplicate_found' : 'draft_created',
        message: duplicate
          ? `Duplicate application found for ${extracted.company} - ${extracted.jobTitle}`
          : `Application draft created. Review and approve before sending.`,
      };
    } catch (error: any) {
      this.logger.error(`AI extraction pipeline failed: ${error.message}`);
      return {
        extractedData: null,
        rawText: jobPasteDto.jobDescriptionRaw,
        error: error.message,
        pipelineStatus: 'error',
        message: `AI extraction failed: ${error.message}. Please try again or create manually.`,
      };
    }
  }

  /**
   * Approve an application for sending.
   */
  async approve(id: string): Promise<Application> {
    const application = await this.findOne(id);
    if (application.reviewStatus !== ReviewStatus.DRAFT) {
      throw new BadRequestException(`Application is already ${application.reviewStatus}`);
    }
    application.reviewStatus = ReviewStatus.APPROVED;
    return await this.applicationsRepository.save(application);
  }

  /**
   * Reject an application with a reason.
   */
  async reject(id: string, reason: string): Promise<Application> {
    const application = await this.findOne(id);
    application.reviewStatus = ReviewStatus.REJECTED;
    application.rejectionReason = reason;
    return await this.applicationsRepository.save(application);
  }

  /**
   * Get dashboard statistics.
   */
  async getStats(): Promise<any> {
    const total = await this.applicationsRepository.count();

    const statusCounts = await this.applicationsRepository
      .createQueryBuilder('app')
      .select('app.applicationStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.applicationStatus')
      .getRawMany();

    const reviewCounts = await this.applicationsRepository
      .createQueryBuilder('app')
      .select('app.reviewStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.reviewStatus')
      .getRawMany();

    const sourceCounts = await this.applicationsRepository
      .createQueryBuilder('app')
      .select('app.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.source')
      .getRawMany();

    const categoryCounts = await this.applicationsRepository
      .createQueryBuilder('app')
      .select('app.jobCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('app.jobCategory IS NOT NULL')
      .groupBy('app.jobCategory')
      .getRawMany();

    // Applications in last 7 days
    const recentCount = await this.applicationsRepository
      .createQueryBuilder('app')
      .where('app.dateApplied >= :date', { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
      .getCount();

    // Response rate
    const respondedCount = await this.applicationsRepository.count({
      where: [
        { applicationStatus: 'Response' as any },
        { applicationStatus: 'Interview' as any },
        { applicationStatus: 'Test' as any },
        { applicationStatus: 'Offer' as any },
      ],
    });

    return {
      total,
      recentCount,
      responseRate: total > 0 ? parseFloat(((respondedCount / total) * 100).toFixed(1)) : 0,
      byStatus: statusCounts.reduce((acc, row) => ({ ...acc, [row.status]: parseInt(row.count) }), {}),
      byReview: reviewCounts.reduce((acc, row) => ({ ...acc, [row.status]: parseInt(row.count) }), {}),
      bySource: sourceCounts.reduce((acc, row) => ({ ...acc, [row.source]: parseInt(row.count) }), {}),
      byCategory: categoryCounts.reduce((acc, row) => ({ ...acc, [row.category]: parseInt(row.count) }), {}),
    };
  }

  async checkDuplicate(company: string, jobTitle: string, jobUrl: string): Promise<Application | null> {
    const conditions: any[] = [];

    if (company && jobTitle) {
      conditions.push({ company, jobTitle });
    }
    if (jobUrl) {
      conditions.push({ jobUrl });
    }

    if (conditions.length === 0) return null;

    return await this.applicationsRepository.findOne({
      where: conditions,
    });
  }
}
