import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

// Mock the OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('AiService', () => {
  let service: AiService;
  let mockOpenAi: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENROUTER_API_KEY') return 'test-api-key';
              if (key === 'AI_MODEL') return 'test-model';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);

    // Initialize and grab the mock model
    service.onModuleInit();
    mockOpenAi = (service as any).openai;
  });

  describe('isAvailable', () => {
    it('should return true when API key is configured', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('extractJobDetails', () => {
    it('should extract structured data from a job description', async () => {
      const mockResponse = JSON.stringify({
        company: 'Acme Corp',
        jobTitle: 'Senior Full Stack Developer',
        location: 'Remote',
        workMode: 'Remote',
        employmentType: 'Full-time',
        recipientEmail: 'hr@acme.com',
        recruiterName: 'Jane Smith',
        requiredSkills: 'React, Node.js, TypeScript, PostgreSQL',
        experienceLevel: 'Senior',
        salaryRange: '$120k-$150k',
        applicationUrl: 'https://acme.com/apply',
        summary: 'Looking for a senior full stack developer to join our team.',
      });

      mockOpenAi.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      });

      const result = await service.extractJobDetails('We are Acme Corp looking for a Senior Full Stack Developer...');

      expect(result.company).toBe('Acme Corp');
      expect(result.jobTitle).toBe('Senior Full Stack Developer');
      expect(result.workMode).toBe('Remote');
      expect(result.requiredSkills).toContain('React');
    });

    it('should use "Unknown" for missing fields (safety rule)', async () => {
      const mockResponse = JSON.stringify({
        company: 'Unknown',
        jobTitle: 'Developer',
        location: 'Unknown',
        workMode: 'Unknown',
        employmentType: 'Unknown',
        recipientEmail: 'Unknown',
        recruiterName: 'Unknown',
        requiredSkills: 'JavaScript',
        experienceLevel: 'Unknown',
        salaryRange: 'Unknown',
        applicationUrl: null,
        summary: 'A developer position.',
      });

      mockOpenAi.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      });

      const result = await service.extractJobDetails('Looking for a developer who knows JavaScript.');

      expect(result.recipientEmail).toBe('Unknown');
      expect(result.recruiterName).toBe('Unknown');
      expect(result.company).toBe('Unknown');
    });

    it('should handle markdown-wrapped JSON response', async () => {
      const mockResponse = '```json\n{"company":"Test Co","jobTitle":"Dev","location":"NYC","workMode":"On-site","employmentType":"Full-time","recipientEmail":"Unknown","recruiterName":"Unknown","requiredSkills":"JS","experienceLevel":"Mid","salaryRange":"Unknown","applicationUrl":null,"summary":"Dev job"}\n```';

      mockOpenAi.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      });

      const result = await service.extractJobDetails('Test job description');

      expect(result.company).toBe('Test Co');
      expect(result.jobTitle).toBe('Dev');
    });

    it('should return fallback defaults when AI returns garbage', async () => {
      mockOpenAi.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'This is not JSON at all!' } }],
      });

      const result = await service.extractJobDetails('Some job description');

      expect(result.company).toBe('Unknown');
      expect(result.jobTitle).toBe('Unknown');
    });

    it('should retry on API failure and throw after retries exhausted', async () => {
      mockOpenAi.chat.completions.create.mockRejectedValue(new Error('API rate limit'));

      await expect(service.extractJobDetails('test')).rejects.toThrow('AI service failed after 3 attempts');
    });
  });

  describe('categorizeJob', () => {
    it('should categorize a full stack job correctly', async () => {
      const mockResponse = JSON.stringify({
        categories: ['Full Stack', 'Backend'],
        primaryCategory: 'Full Stack',
      });

      mockOpenAi.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      });

      const result = await service.categorizeJob(
        'Full Stack Developer',
        'Building web applications',
        'React, Node.js, PostgreSQL',
      );

      expect(result.primaryCategory).toBe('Full Stack');
      expect(result.categories).toContain('Full Stack');
    });
  });

  describe('generateEmail', () => {
    it('should generate a personalized email with subject', async () => {
      // Mock two calls: body then subject
      mockOpenAi.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'I am writing to express my interest in the Senior Developer position at Acme Corp...' } }],
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Application for Senior Developer Position - Ameer Sultan' } }],
        });

      const result = await service.generateEmail(
        { company: 'Acme Corp', jobTitle: 'Senior Developer', requiredSkills: 'React, Node.js', summary: 'Building web apps' },
        { skills: 'React, Node.js, TypeScript', experience: '5 years', targetRoles: 'Full Stack' },
        'Ameer Sultan',
      );

      expect(result.subject).toContain('Senior Developer');
      expect(result.body).toContain('interest');
    });
  });

  describe('matchCv', () => {
    it('should return a confidence score and recommendation', async () => {
      const mockResponse = JSON.stringify({
        confidence: 78,
        matchingSkills: ['React', 'Node.js'],
        missingSkills: ['Go'],
        reasoning: 'Good match on web technologies',
        recommendation: 'good_match',
      });

      mockOpenAi.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      });

      const result = await service.matchCv(
        { jobTitle: 'Full Stack Dev', requiredSkills: 'React, Node.js, Go', experienceLevel: 'Senior', jobDescription: 'Full stack role' },
        { skills: 'React, Node.js, TypeScript', experience: '5 years web dev', education: 'BS CS', yearsOfExperience: '5', targetRoles: 'Full Stack' },
      );

      expect(result.confidence).toBe(78);
      expect(result.recommendation).toBe('good_match');
      expect(result.matchingSkills).toContain('React');
      expect(result.missingSkills).toContain('Go');
    });
  });
});
