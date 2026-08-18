import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [ApplicationsModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
