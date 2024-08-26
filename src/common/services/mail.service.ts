import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

@Injectable()
export class MailerService {
    constructor(private readonly mailService: NestMailerService) {}

    public async sendRegistrationEmail(email: string, code: number): Promise<void> {
        try {
            const sendMailOptions: ISendMailOptions = {
                to: email,
                subject: 'Confirm your Email',
                text: `Your verification code is ${code}`,
            };

            await this.mailService.sendMail(sendMailOptions);
        } catch (error) {
            console.error('Error sending registration email:', error);
            throw new InternalServerErrorException('Failed to send registration email');
        }
    }

    public async sendForgotPasswordEmail(email: string, code: number): Promise<void> {
        try {
            const sendMailOptions: ISendMailOptions = {
                to: email,
                subject: 'Reset Your Password',
                text: `Your Reset Password code is ${code}`,
            };

            await this.mailService.sendMail(sendMailOptions);
        } catch (error) {
            console.error('Error sending Forgot Password email:', error);
            throw new InternalServerErrorException('Failed to send forgot password email');
        }
    }


}

