import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    ConfigModule,
    ApplicationsModule,
  ],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
