import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CV } from './entities/cv.entity';
import { CreateCvDto, UpdateCvDto } from './dto/create-cv.dto';

@Injectable()
export class CvsService {
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

  async findBestMatch(jobDescription: string, requiredSkills?: string): Promise<{ cv: CV; confidence: number }> {
    const activeCvs = await this.findAll();
    
    if (activeCvs.length === 0) {
      throw new NotFoundException('No active CVs available for matching');
    }

    // Simple keyword-based matching for now
    // This will be enhanced with AI-powered semantic matching in Phase 1
    const jobSkills = requiredSkills 
      ? requiredSkills.toLowerCase().split(',').map(s => s.trim())
      : [];

    let bestMatch = activeCvs[0];
    let bestScore = 0;

    for (const cv of activeCvs) {
      const cvSkills = cv.skills.toLowerCase().split(',').map(s => s.trim());
      let score = 0;

      // Count matching skills
      for (const skill of jobSkills) {
        if (cvSkills.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))) {
          score += 1;
        }
      }

      // Also consider years of experience if available
      if (cv.yearsOfExperience) {
        score += Math.min(parseInt(cv.yearsOfExperience) || 0, 5) * 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = cv;
      }
    }

    // Normalize confidence to 0-100
    const confidence = Math.min((bestScore / (jobSkills.length + 5)) * 100, 100);

    return {
      cv: bestMatch,
      confidence: parseFloat(confidence.toFixed(2)),
    };
  }
}
