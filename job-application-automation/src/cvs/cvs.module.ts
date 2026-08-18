import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { CV } from './entities/cv.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CV])],
  controllers: [CvsController],
  providers: [CvsService],
  exports: [CvsService],
})
export class CvsModule {}
