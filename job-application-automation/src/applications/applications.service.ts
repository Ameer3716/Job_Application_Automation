import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { CreateApplicationDto, UpdateApplicationDto, JobPasteDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
  ) {}

  async create(createApplicationDto: CreateApplicationDto): Promise<Application> {
    const application = this.applicationsRepository.create(createApplicationDto);
    return await this.applicationsRepository.save(application);
  }

  async findAll(): Promise<Application[]> {
    return await this.applicationsRepository.find({
      order: { dateApplied: 'DESC' },
    });
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

  async processJobPaste(jobPasteDto: JobPasteDto): Promise<any> {
    // This will be enhanced with AI extraction in Phase 1
    // For now, return a basic structure
    return {
      extractedData: {
        jobDescription: jobPasteDto.jobDescriptionRaw,
        jobUrl: jobPasteDto.jobUrl || '',
      },
      message: 'Job description received. AI extraction to be implemented.',
    };
  }

  async checkDuplicate(company: string, jobTitle: string, jobUrl: string): Promise<Application | null> {
    return await this.applicationsRepository.findOne({
      where: [
        { company, jobTitle },
        { jobUrl },
      ],
    });
  }
}
