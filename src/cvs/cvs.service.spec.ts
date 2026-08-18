import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CvsService } from './cvs.service';
import { CV } from './entities/cv.entity';

describe('CvsService', () => {
  let service: CvsService;
  let repo: any;

  const mockCvs = [
    {
      id: '1',
      fileName: 'frontend.pdf',
      skills: 'React, TypeScript, CSS',
      targetRoles: 'Frontend Developer',
      yearsOfExperience: '3',
      isActive: true,
    },
    {
      id: '2',
      fileName: 'backend.pdf',
      skills: 'Node.js, PostgreSQL, NestJS, Go',
      targetRoles: 'Backend Developer, Full Stack',
      yearsOfExperience: '5',
      isActive: true,
    },
  ];

  const mockRepository = {
    find: jest.fn().mockResolvedValue(mockCvs),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvsService,
        {
          provide: getRepositoryToken(CV),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CvsService>(CvsService);
    repo = module.get(getRepositoryToken(CV));
  });

  describe('findBestMatch (fallback keyword matching)', () => {
    it('should match a frontend CV for a frontend role based on skills', async () => {
      const jobDescription = 'Looking for someone to build UIs.';
      const requiredSkills = 'React, CSS, HTML';

      const result = await service.findBestMatch(jobDescription, requiredSkills);

      expect(result.cv.fileName).toBe('frontend.pdf');
      // React + CSS = 4 points. 
      // maxPossible = (3*2) + (keywords*0.5) + 10 = ~18+
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should match a backend CV based on role description and keywords', async () => {
      const jobDescription = 'We need a Backend Developer who knows how to scale Node.js applications.';
      const requiredSkills = 'Node.js, Go';

      const result = await service.findBestMatch(jobDescription, requiredSkills);

      expect(result.cv.fileName).toBe('backend.pdf');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should throw if no active CVs exist', async () => {
      repo.find.mockResolvedValueOnce([]);
      
      await expect(service.findBestMatch('job', 'skills')).rejects.toThrow('No active CVs available');
    });
  });
});
