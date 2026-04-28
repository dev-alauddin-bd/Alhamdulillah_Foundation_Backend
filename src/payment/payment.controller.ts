import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  HttpCode,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentService } from './payment.service';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  // ===============================
  // USER → INITIATE PAYMENT
  // ===============================
  @Post('initiate')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async initiatePayment(@Body() dto: InitiatePaymentDto, @Req() req) {
    const result = await this.paymentService.processPayment(
      req.user._id,
      dto,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Payment initiated successfully',
      data: result,
    };
  }

  // ===============================
  // USER → SUBMIT MANUAL PAYMENT DETAILS
  // ===============================
  @Post('manual-submit')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async submitManualPayment(
    @Body() dto: { paymentId: string; transactionId: string; senderNumber?: string; screenshot?: string },
    @Req() req
  ) {
    return this.paymentService.submitManualPayment(req.user._id, dto);
  }

  // ===============================
  // ADMIN → APPROVE MANUAL PAYMENT
  // ===============================
  @Post('approve/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(200)
  async approvePayment(@Param('id') id: string) {
    return this.paymentService.approvePayment(id);
  }

  // ===============================
  // BKASH CALLBACK (SUCCESS/FAIL/CANCEL)
  // ===============================
  @Get('bkash/callback')
  async bkashCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Res() res: Response
  ) {
    const result = await this.paymentService.handleBkashCallback(paymentID, status);
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    
    if (result.success) {
      return res.redirect(`${frontendUrl}/payment/success?paymentID=${paymentID}`);
    } else {
      return res.redirect(`${frontendUrl}/payment/fail?message=${encodeURIComponent(result.message || 'Payment failed')}`);
    }
  }

  // ===============================
  // GET PAYMENT INVOICE BY ID
  // ===============================
  @Get('invoice/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async getPaymentInvoice(@Param('id') id: string, @Req() req) {
    const payment = await this.paymentService.getPaymentById(
      id,
      req.user._id,
      req.user.role,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Invoice retrieved successfully',
      data: payment,
    };
  }

  // ===============================
  // USER → GET MY PAYMENTS
  // ===============================
  @Get('my-payments')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async getMyPayments(@Query() query: any, @Req() req) {
    const result = await this.paymentService.getUserPayments(
      req.user._id,
      query,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Your payments retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  // ===============================
  // ADMIN → GET ALL PAYMENTS
  // ===============================
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllPayments(@Query() query: any) {
    return this.paymentService.getAllPayments(query);
  }
}

