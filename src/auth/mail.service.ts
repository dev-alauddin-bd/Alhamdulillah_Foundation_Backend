import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');
    if (mailUser && mailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailUser,
          pass: mailPass,
        },
      });
    }
  }

  async sendOTP(email: string, code: string, type: string) {
    const subject = type === 'REGISTRATION' 
        ? 'Account Registration OTP' 
        : 'Password Change OTP';
    
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0D9488; text-align: center;">ALHAMDULILLAH FOUNDATION</h2>
        <p>Hello,</p>
        <p>Your OTP code for <strong>${subject}</strong> is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0D9488; background: #f0fdfa; padding: 10px 30px; border-radius: 8px; border: 2px dashed #0D9488;">
            ${code}
          </span>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center;">This code will expire in 5 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 10px; text-align: center;">Please do not share this code with anyone.</p>
      </div>
    `;

    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    if (resendApiKey) {
      try {
        console.log(`📡 Sending OTP to ${email} using Resend API...`);
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: 'Alhamdulillah Foundation <onboarding@resend.dev>',
            to: [email],
            subject: subject,
            html: message,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          console.log(`✅ Email sent successfully via Resend API to ${email}`);
          return true;
        }
      } catch (error: any) {
        console.error('❌ Resend API Error:', error?.response?.data || error?.message || error);
      }
    }

    if (this.transporter) {
      try {
        console.log(`📡 Sending OTP to ${email} using Gmail SMTP...`);
        await this.transporter.sendMail({
          from: '"Alhamdulillah Foundation" <noreply@foundation.com>',
          to: email,
          subject: subject,
          html: message,
        });
        console.log(`✅ Email sent successfully via Gmail SMTP to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Gmail SMTP Error:', error);
      }
    }

    console.log(`[DEV OTP] for ${email}: ${code}`);
    return false;
  }
}
