import { Injectable } from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { Workbook } from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * Generate CSV string from applications data.
   */
  async generateCsv(filters?: {
    status?: string;
    company?: string;
  }): Promise<string> {
    const applications = await this.getFilteredApplications(filters);

    // CSV header
    const headers = [
      'ID', 'Date Applied', 'Source', 'Apply Method', 'Company', 'Job Title',
      'Location', 'Work Mode', 'Employment Type', 'Recipient Email',
      'Recruiter Name', 'Job URL', 'Required Skills', 'Job Category',
      'Selected CV', 'CV Match Confidence', 'Email Subject',
      'Email Status', 'Application Status', 'Follow Up Date', 'Notes',
    ];

    const rows = applications.map(app => [
      app.id,
      app.dateApplied?.toISOString() || '',
      app.source,
      app.applyMethod,
      this.escapeCsvField(app.company),
      this.escapeCsvField(app.jobTitle),
      this.escapeCsvField(app.location || ''),
      app.workMode || '',
      app.employmentType || '',
      app.recipientEmail || '',
      this.escapeCsvField(app.recruiterName || ''),
      app.jobUrl,
      this.escapeCsvField(app.requiredSkills || ''),
      app.jobCategory || '',
      app.selectedCv || '',
      app.cvMatchConfidence?.toString() || '',
      this.escapeCsvField(app.emailSubject || ''),
      app.emailStatus || '',
      app.applicationStatus,
      app.followUpDate?.toISOString() || '',
      this.escapeCsvField(app.notes || ''),
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Generate XLSX buffer from applications data.
   */
  async generateXlsx(filters?: {
    status?: string;
    company?: string;
  }): Promise<Buffer> {
    const applications = await this.getFilteredApplications(filters);

    const workbook = new Workbook();
    workbook.creator = 'Job Application Automation';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Applications');

    // Define columns
    sheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Date Applied', key: 'dateApplied', width: 20 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Apply Method', key: 'applyMethod', width: 15 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Job Title', key: 'jobTitle', width: 30 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Work Mode', key: 'workMode', width: 12 },
      { header: 'Employment Type', key: 'employmentType', width: 15 },
      { header: 'Recipient Email', key: 'recipientEmail', width: 25 },
      { header: 'Recruiter Name', key: 'recruiterName', width: 20 },
      { header: 'Job URL', key: 'jobUrl', width: 40 },
      { header: 'Required Skills', key: 'requiredSkills', width: 40 },
      { header: 'Job Category', key: 'jobCategory', width: 20 },
      { header: 'Selected CV', key: 'selectedCv', width: 20 },
      { header: 'CV Match %', key: 'cvMatchConfidence', width: 12 },
      { header: 'Email Subject', key: 'emailSubject', width: 40 },
      { header: 'Email Status', key: 'emailStatus', width: 12 },
      { header: 'Application Status', key: 'applicationStatus', width: 18 },
      { header: 'Follow Up Date', key: 'followUpDate', width: 20 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    for (const app of applications) {
      sheet.addRow({
        id: app.id,
        dateApplied: app.dateApplied,
        source: app.source,
        applyMethod: app.applyMethod,
        company: app.company,
        jobTitle: app.jobTitle,
        location: app.location || '',
        workMode: app.workMode || '',
        employmentType: app.employmentType || '',
        recipientEmail: app.recipientEmail || '',
        recruiterName: app.recruiterName || '',
        jobUrl: app.jobUrl,
        requiredSkills: app.requiredSkills || '',
        jobCategory: app.jobCategory || '',
        selectedCv: app.selectedCv || '',
        cvMatchConfidence: app.cvMatchConfidence || 0,
        emailSubject: app.emailSubject || '',
        emailStatus: app.emailStatus || '',
        applicationStatus: app.applicationStatus,
        followUpDate: app.followUpDate || '',
        notes: app.notes || '',
      });
    }

    // Auto-filter
    sheet.autoFilter = {
      from: 'A1',
      to: `U${applications.length + 1}`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // --- Helpers ---

  private async getFilteredApplications(filters?: {
    status?: string;
    company?: string;
  }): Promise<import('../applications/entities/application.entity').Application[]> {
    if (filters?.status) {
      return this.applicationsService.findByStatus(filters.status);
    }
    if (filters?.company) {
      return this.applicationsService.findByCompany(filters.company);
    }
    const result = await this.applicationsService.findAll(1, 10000);
    return result.data;
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
