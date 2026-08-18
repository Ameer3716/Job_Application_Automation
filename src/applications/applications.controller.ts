import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto, JobPasteDto } from './dto/create-application.dto';

@Controller('applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(createApplicationDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('company') company?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    if (status) {
      return this.applicationsService.findByStatus(status);
    }
    if (company) {
      return this.applicationsService.findByCompany(company);
    }
    return this.applicationsService.findAll(page, limit);
  }

  @Get('stats')
  getStats() {
    return this.applicationsService.getStats();
  }

  @Get('duplicates/check')
  checkDuplicate(
    @Query('company') company: string,
    @Query('jobTitle') jobTitle: string,
    @Query('jobUrl') jobUrl: string,
  ) {
    return this.applicationsService.checkDuplicate(company, jobTitle, jobUrl);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }

  @Post('paste')
  @HttpCode(HttpStatus.ACCEPTED)
  processJobPaste(@Body() jobPasteDto: JobPasteDto) {
    return this.applicationsService.processJobPaste(jobPasteDto);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string) {
    return this.applicationsService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.applicationsService.reject(id, reason);
  }
}
