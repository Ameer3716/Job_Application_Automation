import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { Application, ApplicationSource, ApplyMethod, ApplicationStatus, ReviewStatus } from './entities/application.entity';
import { AiService } from '../ai/ai.service';
import { CvsService } from '../cvs/cvs.service';
import { BadRequestException } from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let repo: any;
  let aiService: any;
  let cvsService: any;

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: '123', ...entity })),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  const mockAiService = {
    isAvailable: jest.fn().mockReturnValue(true),
    extractJobDetails: jest.fn().mockResolvedValue({
      company: 'Tech Corp',
      jobTitle: 'Backend Dev',
      requiredSkills: 'Node.js',
      recipientEmail: 'hr@techcorp.com',
    }),
    categorizeJob: jest.fn().mockResolvedValue({
      categories: ['Backend'],
    }),
    matchCv: jest.fn().mockResolvedValue({
      confidence: 85,
      reasoning: 'Good match',
      recommendation: 'strong_match',
    }),
    generateEmail: jest.fn().mockResolvedValue({
      subject: 'Application',
      body: 'Hello HR...',
    }),
  };

  const mockCvsService = {
    findAll: jest.fn().mockResolvedValue([{ id: '1', fileName: 'resume.pdf', skills: 'Node.js' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockRepository,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: CvsService,
          useValue: mockCvsService,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    repo = module.get(getRepositoryToken(Application));
    aiService = module.get(AiService);
    cvsService = module.get(CvsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processJobPaste', () => {
    it('should successfully process a job paste through the AI pipeline', async () => {
      const dto = { jobDescriptionRaw: 'Looking for a Node.js dev at Tech Corp' };
      
      const result = await service.processJobPaste(dto);

      expect(aiService.extractJobDetails).toHaveBeenCalledWith(dto.jobDescriptionRaw);
      expect(aiService.categorizeJob).toHaveBeenCalled();
      expect(aiService.matchCv).toHaveBeenCalled();
      expect(aiService.generateEmail).toHaveBeenCalled();
      
      expect(result.pipelineStatus).toBe('draft_created');
      expect(result.application).toBeDefined();
      expect(result.application.company).toBe('Tech Corp');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should fallback gracefully if AI is unavailable', async () => {
      aiService.isAvailable.mockReturnValueOnce(false);
      const dto = { jobDescriptionRaw: 'Raw job text' };
      
      const result = await service.processJobPaste(dto);

      expect(result.pipelineStatus).toBe('ai_unavailable');
      expect(result.extractedData).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should transition a DRAFT to APPROVED', async () => {
      repo.findOne.mockResolvedValueOnce({ id: '1', reviewStatus: ReviewStatus.DRAFT });
      
      const result = await service.approve('1');
      
      expect(result.reviewStatus).toBe(ReviewStatus.APPROVED);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw if already approved', async () => {
      repo.findOne.mockResolvedValueOnce({ id: '1', reviewStatus: ReviewStatus.APPROVED });
      
      await expect(service.approve('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should transition a DRAFT to REJECTED with a reason', async () => {
      repo.findOne.mockResolvedValueOnce({ id: '1', reviewStatus: ReviewStatus.DRAFT });
      
      const result = await service.reject('1', 'Too low salary');
      
      expect(result.reviewStatus).toBe(ReviewStatus.REJECTED);
      expect(result.rejectionReason).toBe('Too low salary');
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
