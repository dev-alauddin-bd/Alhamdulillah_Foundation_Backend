import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum OTPType {
  REGISTRATION = 'REGISTRATION',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
}

@Schema({ timestamps: true })
export class OTP extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, expires: 300 }) // Expires in 5 minutes
  expiresAt: Date;

  @Prop({ type: String, enum: OTPType, default: OTPType.REGISTRATION })
  type: OTPType;
}

export const OTPSchema = SchemaFactory.createForClass(OTP);
