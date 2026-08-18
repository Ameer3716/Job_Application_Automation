import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { AiModule } from '../ai/ai.module';
import { CvsModule } from '../cvs/cvs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    AiModule,
    CvsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
