import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ApplicationsService } from '../applications/applications.service';
import { EmailStatus, ReviewStatus } from '../applications/entities/application.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(
    private configService: ConfigService,
    private applicationsService: ApplicationsService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is missing. Email sending will be disabled.');
    }
  }

  /**
   * Send an approved application email using Resend API.
   */
  async sendApplicationEmail(applicationId: string): Promise<any> {
    const application = await this.applicationsService.findOne(applicationId);

    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    if (application.reviewStatus !== ReviewStatus.APPROVED && application.reviewStatus !== ReviewStatus.SENT) {
      throw new BadRequestException(`Application must be approved before sending. Current status: ${application.reviewStatus}`);
    }

    if (!application.recipientEmail) {
      throw new BadRequestException('Recipient email is missing for this application');
    }

    if (!application.emailSubject || !application.emailBody) {
      throw new BadRequestException('Email subject or body is missing');
    }

    if (!this.resend) {
      throw new BadRequestException('Resend API key is not configured');
    }

    try {
      this.logger.log(`Sending email for application ${applicationId} via Resend...`);
      
      // Convert text body to basic HTML (replace newlines with <br>)
      const htmlBody = application.emailBody
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
        .join('');

      const { data, error } = await this.resend.emails.send({
        from: 'onboarding@resend.dev', // Default testing domain from Resend
        to: 'ameersultan0310@gmail.com', // Sending to yourself for testing instead of recipientEmail to avoid spamming real companies during dev
        subject: application.emailSubject,
        html: htmlBody,
        replyTo: 'ameersultan0310@gmail.com',
      });

      if (error) {
        this.logger.error(`Resend API error: ${JSON.stringify(error)}`);
        
        // Update application status
        await this.applicationsService.update(applicationId, {
          emailStatus: EmailStatus.FAILED,
          notes: (application.notes ? application.notes + '\n' : '') + `Email failed to send: ${error.message}`,
        });
        
        throw new BadRequestException(`Failed to send email: ${error.message}`);
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      
      // Update application status
      await this.applicationsService.update(applicationId, {
        emailStatus: EmailStatus.SENT,
        reviewStatus: ReviewStatus.SENT,
        applicationStatus: 'Email Sent' as any,
      });

      return {
        success: true,
        message: 'Email sent successfully via Resend',
        id: data?.id,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}
