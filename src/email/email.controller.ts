import { Controller, Post, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from './email.service';

@Controller('email')
@UseGuards(AuthGuard('jwt'))
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post(':applicationId/send')
  @HttpCode(HttpStatus.OK)
  sendApplicationEmail(@Param('applicationId') applicationId: string) {
    return this.emailService.sendApplicationEmail(applicationId);
  }
}
