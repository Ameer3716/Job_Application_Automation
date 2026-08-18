import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(AuthGuard('jwt'))
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('csv')
  async exportCsv(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('company') company?: string,
  ) {
    const csv = await this.exportService.generateCsv({ status, company });
    const filename = `applications_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('xlsx')
  async exportXlsx(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('company') company?: string,
  ) {
    const buffer = await this.exportService.generateXlsx({ status, company });
    const filename = `applications_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
