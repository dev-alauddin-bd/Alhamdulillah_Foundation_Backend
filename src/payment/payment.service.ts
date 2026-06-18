import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentPurpose,
} from './schemas/payment.schema';

import { UserService } from 'src/user/user.service';
import { SslGateway } from './getways/ssl/ssl.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from 'src/user/schemas/user.schema';
import { FundService } from 'src/fund/fund.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly sslGateway: SslGateway,
    private readonly userService: UserService,
    private readonly fundService: FundService,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) { }

  async processPayment(
    userId: string,
    dto: { method: PaymentMethod; amount: number; purpose: PaymentPurpose },
  ) {
    const { method, amount, purpose } = dto;

    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const date = new Date().getDate().toString().padStart(2, '0');
    const transactionId = `TXN${year}${randomNum}${date}`;

    const user = await this.userService.findUserById(userId);

    // CREATE PAYMENT RECORD
    const payment: any = await this.paymentModel.create({
      userId,
      amount,
      method,
      purpose,
      transactionId: method.includes('MANUAL') ? undefined : transactionId, // Manual will provide their own TrxID later
      paymentStatus: PaymentStatus.PENDING,
    });

    const payload = {
      user,
      userId,
      amount,
      purpose,
      transactionId: payment.transactionId,
      paymentId: payment._id,
    };

    switch (method) {
      case PaymentMethod.SSL_GATEWAY:
        const sslResult = await this.sslGateway.createPayment({
          ...payload,
          transactionId: payment.transactionId,
        });
        return { gatewayUrl: sslResult.gatewayUrl, paymentId: payment._id };

      case PaymentMethod.BKASH_MANUAL:
      case PaymentMethod.NAGAD_MANUAL:
      case PaymentMethod.ROCKET_MANUAL:
        return { message: 'Please submit transaction details', paymentId: payment._id };

      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  async submitManualPayment(
    userId: string,
    dto: { paymentId: string; transactionId: string; senderNumber?: string; screenshot?: string },
  ) {
    const { paymentId, transactionId, senderNumber, screenshot } = dto;

    const payment = await this.paymentModel.findOne({ _id: paymentId, userId });
    if (!payment) {
      throw new BadRequestException('Payment record not found');
    }

    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already completed');
    }

    // Check if this transactionId is already used
    const existing = await this.paymentModel.findOne({ transactionId });
    if (existing && existing._id.toString() !== paymentId) {
      throw new BadRequestException('This Transaction ID has already been used');
    }

    payment.transactionId = transactionId;
    payment.senderNumber = senderNumber;
    payment.screenshot = screenshot;
    payment.paymentStatus = PaymentStatus.PENDING; // Needs admin approval
    await payment.save();

    return { success: true, message: 'Payment details submitted. Waiting for approval.' };
  }

  async getUserPayments(userId: string, query: any) {
    const { status, page = 1, limit = 10 } = query || {};
    const filter: any = { userId };

    if (status && status !== "ALL") {
      filter.paymentStatus = status;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllPayments(query: any) {
    const { status, search, page = 1, limit = 10 } = query || {};
    const filter: any = {};

    if (status && status !== "ALL") {
      filter.paymentStatus = status;
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { senderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ADMIN APPROVAL FOR MANUAL PAYMENTS
   */
  async approvePayment(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new BadRequestException('Payment not found');

    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already approved');
    }

    await this.completePaymentProcess(payment._id.toString());
    return { success: true, message: 'Payment approved successfully' };
  }

  /**
   * UNIVERSAL POST-PAYMENT PROCESS
   */
  private async completePaymentProcess(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment || payment.paymentStatus === PaymentStatus.PAID) {
      return;
    }

    console.log(`[PAYMENT] Processing completion for ${paymentId} (${payment.transactionId})`);

    // 1. Update Payment Record
    payment.paymentStatus = PaymentStatus.PAID;
    payment.paidAt = new Date();
    await payment.save();

    // 2. Fund Injection (Donations)
    if (payment.purpose === PaymentPurpose.MONTHLY_DONATION || payment.purpose === PaymentPurpose.PROJECT_DONATION) {
      await this.fundService.addTransactionFromPayment(
        payment.userId.toString(),
        payment.amount,
        payment._id.toString(),
        payment.transactionId || '',
        payment.purpose === PaymentPurpose.MONTHLY_DONATION ? 'Monthly Donation' : 'Project Donation',
      );
      console.log(`[PAYMENT] Fund record created for ${payment.transactionId}`);
    }

    // 3. Authority Elevation (Membership)
    if (payment.purpose === PaymentPurpose.MEMBERSHIP_FEE) {
      const user = await this.userModel.findById(payment.userId);
      if (user) {
        user.role = UserRole.MEMBER;
        user.status = UserStatus.ACTIVE;
        await user.save();
        console.log(`[PAYMENT] Authority elevated to MEMBER for user: ${user.email}`);
      }
    }
  }

  // ===============================
  // BKASH GATEWAY CALLBACKS
  // ===============================


  // ===============================
  // SSLCOMMERZ GATEWAY CALLBACKS
  // ===============================
  async handleSslCallback(body: any) {
    const { status, tran_id, val_id } = body;
    if (status !== 'VALID') {
      return { success: false, message: `Payment status: ${status}` };
    }

    const payment = await this.paymentModel.findOne({ transactionId: tran_id });
    if (!payment) {
      return { success: false, message: 'Payment record not found' };
    }

    // Verify payment using gateway validate API
    const validationResult = await this.sslGateway.verifyPayment({ val_id });
    if (validationResult?.status === 'VALID') {
      await this.completePaymentProcess(payment._id.toString());
      return { success: true, paymentId: payment._id.toString(), message: 'Payment verified successfully' };
    }

    return { success: false, message: 'Payment verification failed at gateway' };
  }

  async getPaymentById(id: string, userId: string, role: string) {
    const payment = await this.paymentModel.findById(id).populate('userId', 'name email phone address cityState avatar');
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.userId['_id'].toString() !== userId && role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
      throw new BadRequestException('Unauthorized access to invoice');
    }

    return payment;
  }
}
