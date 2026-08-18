import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CV } from './entities/cv.entity';
import { CreateCvDto, UpdateCvDto } from './dto/create-cv.dto';

@Injectable()
export class CvsService {
  private readonly logger = new Logger(CvsService.name);

  constructor(
    @InjectRepository(CV)
    private cvsRepository: Repository<CV>,
  ) {}

  async create(createCvDto: CreateCvDto): Promise<CV> {
    const cv = this.cvsRepository.create(createCvDto);
    return await this.cvsRepository.save(cv);
  }

  async findAll(): Promise<CV[]> {
    return await this.cvsRepository.find({
      where: { isActive: true },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CV> {
    const cv = await this.cvsRepository.findOne({ where: { id } });
    if (!cv) {
      throw new NotFoundException(`CV with ID ${id} not found`);
    }
    return cv;
  }

  async update(id: string, updateCvDto: UpdateCvDto): Promise<CV> {
    const cv = await this.findOne(id);
    Object.assign(cv, updateCvDto);
    return await this.cvsRepository.save(cv);
  }

  async remove(id: string): Promise<void> {
    const cv = await this.findOne(id);
    cv.isActive = false; // Soft delete
    await this.cvsRepository.save(cv);
  }

  /**
   * Keyword-based CV matching — used as a fallback when AI is unavailable.
   * AI-powered semantic matching is done via AiService.matchCv() called from ApplicationsService.
   */
  async findBestMatch(jobDescription: string, requiredSkills?: string): Promise<{ cv: CV; confidence: number }> {
    const activeCvs = await this.findAll();

    if (activeCvs.length === 0) {
      throw new NotFoundException('No active CVs available for matching');
    }

    const jobSkills = requiredSkills
      ? requiredSkills.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // Also extract keywords from job description
    const descriptionWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3);

    let bestMatch = activeCvs[0];
    let bestScore = 0;

    for (const cv of activeCvs) {
      const cvSkills = cv.skills.toLowerCase().split(',').map(s => s.trim());
      let score = 0;

      // Count matching skills (weighted 2x)
      for (const skill of jobSkills) {
        if (cvSkills.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))) {
          score += 2;
        }
      }

      // Count matching keywords from description (weighted 0.5x)
      for (const word of descriptionWords) {
        if (cvSkills.some(cvSkill => cvSkill.includes(word))) {
          score += 0.5;
        }
      }

      // Consider target roles match
      if (cv.targetRoles) {
        const targetRoles = cv.targetRoles.toLowerCase().split(',').map(r => r.trim());
        for (const role of targetRoles) {
          if (jobDescription.toLowerCase().includes(role)) {
            score += 3; // High weight for role match
          }
        }
      }

      // Consider years of experience
      if (cv.yearsOfExperience) {
        score += Math.min(parseInt(cv.yearsOfExperience) || 0, 5) * 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = cv;
      }
    }

    // Normalize confidence to 0-100
    const maxPossible = (jobSkills.length * 2) + (descriptionWords.length * 0.5) + 10;
    const confidence = Math.min((bestScore / Math.max(maxPossible, 1)) * 100, 100);

    this.logger.debug(`CV match: ${bestMatch.fileName} with confidence ${confidence.toFixed(2)}%`);

    return {
      cv: bestMatch,
      confidence: parseFloat(confidence.toFixed(2)),
    };
  }
}
