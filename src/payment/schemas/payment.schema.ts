import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentMethod {
  BKASH_GATEWAY = 'BKASH_GATEWAY',
  SSL_GATEWAY = 'SSL_GATEWAY',
  BKASH_MANUAL = 'BKASH_MANUAL',
  NAGAD_MANUAL = 'NAGAD_MANUAL',
  ROCKET_MANUAL = 'ROCKET_MANUAL',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentPurpose {
  MEMBERSHIP_FEE = 'MEMBERSHIP_FEE',
  MONTHLY_DONATION = 'MONTHLY_DONATION',
  PROJECT_DONATION = 'PROJECT_DONATION',
}



@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  method: PaymentMethod;



  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, enum: PaymentPurpose, required: true })
  purpose: PaymentPurpose;

  // bkash trx / nagad trx / bank ref / gateway trx
  @Prop({ trim: true })
  transactionId?: string;

  @Prop({ trim: true })
  senderNumber?: string;

  @Prop({ trim: true })
  screenshot?: string;
  
  @Prop()
  paidAt?: Date;

  @Prop({ type: Number })
  month?: number;

  @Prop({ type: Number })
  year?: number;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ userId: 1, createdAt: -1 });
