import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class BkashGateway {
  private readonly baseUrl: string;
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly username: string;
  private readonly password: string;

  constructor(private readonly configService: ConfigService) {
    const isLive = this.configService.get<string>('BKASH_IS_LIVE') === 'true';
    this.baseUrl = isLive
      ? 'https://tokenized.pay.bka.sh/v1.2.0-beta' // Live URL
      : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'; // Sandbox URL
      
    this.appKey = this.configService.get<string>('BKASH_APP_KEY') || '';
    this.appSecret = this.configService.get<string>('BKASH_APP_SECRET') || '';
    this.username = this.configService.get<string>('BKASH_USERNAME') || '';
    this.password = this.configService.get<string>('BKASH_PASSWORD') || '';
  }

  private async getToken() {
    console.log('[bKash] Requesting token with username:', this.username);
    if (!this.appKey || !this.appSecret || !this.username || !this.password) {
      console.warn('[bKash] Missing credentials in .env file!');
    }

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/tokenized/checkout/token/grant`,
        {
          app_key: this.appKey,
          app_secret: this.appSecret,
        },
        {
          headers: {
            'x-app-key': this.appKey,
            'Content-Type': 'application/json',
            username: this.username,
            password: this.password,
          },
        },
      );
      
      if (data.id_token) {
        console.log('[bKash] Token generated successfully:', data.id_token.substring(0, 10) + '...');
      } else {
        console.warn('[bKash] No id_token returned in response:', data);
      }
      
      return data.id_token;
    } catch (error) {
      console.error('bKash Token Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to get bKash token');
    }
  }

  async createPayment(payload: any) {
    const token = await this.getToken();
    if (!token) throw new BadRequestException('bKash authorization failed');
    
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/tokenized/checkout/create`,
        {
          amount: payload.amount,
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: payload.transactionId,
        },
        {
          headers: {
            authorization: token,
            'x-app-key': this.appKey,
          },
        },
      );
      return data; // Returns bkashURL and paymentID
    } catch (error) {
      console.error('bKash Create Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create bKash payment');
    }
  }

  async executePayment(paymentID: string) {
    const token = await this.getToken();
    if (!token) throw new BadRequestException('bKash authorization failed');

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/tokenized/checkout/execute`,
        { paymentID },
        {
          headers: {
            authorization: token,
            'x-app-key': this.appKey,
          },
        },
      );
      return data;
    } catch (error) {
      console.error('bKash Execute Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to execute bKash payment');
    }
  }
}
