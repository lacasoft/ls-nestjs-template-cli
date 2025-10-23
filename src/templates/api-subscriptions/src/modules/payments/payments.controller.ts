import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  UseGuards,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Param,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './services/payments.service';
import { StripeService } from './services/stripe.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreatePayPalOrderDto } from './dto/create-paypal-order.dto';
import { CapturePayPalOrderDto } from './dto/capture-paypal-order.dto';
import { BankTransferUploadDto } from './dto/bank-transfer-upload.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  // ==================== STRIPE PAYMENTS ====================

  @Post('stripe/create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Stripe payment intent',
    description:
      'Creates a Stripe payment intent for subscription payment. Returns client secret for frontend integration.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    schema: {
      example: {
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        clientSecret: 'pi_3MKJj1L8w8qKhW2j0QqZ5v8g_secret_xxx',
        paymentIntentId: 'pi_3MKJj1L8w8qKhW2j0QqZ5v8g',
        amount: 874.17,
        currency: 'MXN',
        status: 'requires_payment_method',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to subscription' })
  async createStripePaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Request() req,
  ) {
    return this.paymentsService.createStripePaymentIntent(createPaymentIntentDto, req.user.userId);
  }

  @Post('stripe/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm Stripe payment',
    description:
      'Confirms a Stripe payment intent. Can be used to check payment status or manually confirm if needed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved/confirmed',
    schema: {
      example: {
        success: true,
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'succeeded',
        message: 'Payment completed successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to transaction' })
  async confirmStripePayment(@Body() confirmPaymentDto: ConfirmPaymentDto, @Request() req) {
    return this.paymentsService.confirmStripePayment(confirmPaymentDto, req.user.userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user transaction history',
    description:
      'Retrieves paginated transaction history for the authenticated user with optional filters.',
  })
  @ApiQuery({
    name: 'subscriptionId',
    required: false,
    type: String,
    description: 'Filter by subscription ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
    example: 'succeeded',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: ['stripe', 'paypal', 'bank_transfer'],
    example: 'stripe',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    schema: {
      example: {
        transactions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            amount: 49.99,
            currency: 'MXN',
            paymentMethod: 'stripe',
            status: 'completed',
            transactionType: 'subscription_payment',
            description: 'Payment for Professional plan',
            paidAt: '2025-01-13T10:30:00Z',
            createdAt: '2025-01-13T10:25:00Z',
            subscription: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              plan: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                name: 'Professional',
                price: 49.99,
              },
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 45,
          totalPages: 3,
        },
      },
    },
  })
  async getUserTransactions(@Query() filters: GetTransactionsDto, @Request() req) {
    return this.paymentsService.getUserTransactions(req.user.userId, filters);
  }

  // ==================== PAYPAL PAYMENTS ====================

  @Post('paypal/create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create PayPal order',
    description:
      'Creates a PayPal order for subscription payment. Returns approval URL for user to complete payment.',
  })
  @ApiResponse({
    status: 201,
    description: 'PayPal order created successfully',
    schema: {
      example: {
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        orderId: '5O190127TN364715T',
        status: 'CREATED',
        approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T',
        amount: 49.99,
        currency: 'USD',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to subscription' })
  async createPayPalOrder(@Body() createPayPalOrderDto: CreatePayPalOrderDto, @Request() req) {
    return this.paymentsService.createPayPalOrder(createPayPalOrderDto, req.user.userId);
  }

  @Post('paypal/capture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Capture PayPal order',
    description:
      'Captures a PayPal order after user approval. Completes the payment and activates subscription.',
  })
  @ApiResponse({
    status: 200,
    description: 'PayPal payment captured successfully',
    schema: {
      example: {
        success: true,
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        captureId: '2GG279541U471931P',
        status: 'completed',
        message: 'Payment captured successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to transaction' })
  async capturePayPalOrder(@Body() capturePayPalOrderDto: CapturePayPalOrderDto, @Request() req) {
    return this.paymentsService.capturePayPalOrder(capturePayPalOrderDto, req.user.userId);
  }

  // ==================== BANK TRANSFER / DEPÓSITO BANCARIO ====================

  @Get('bank-info')
  @ApiOperation({
    summary: 'Get bank transfer information',
    description: 'Returns bank account details for manual bank transfer payments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank information retrieved successfully',
    schema: {
      example: {
        bankName: 'Bank of Example',
        accountNumber: '1234567890',
        accountHolder: 'Company Name',
        accountType: 'Checking',
        routingNumber: '000000000',
        swiftCode: 'XXXXXX',
        whatsappNumber: '+525512345678',
        whatsappMessage: 'Al realizar el pago, envía tu comprobante a este WhatsApp',
        instructions:
          'Please make the transfer to the account above and upload your receipt proof.',
      },
    },
  })
  async getBankInfo() {
    return this.paymentsService.getBankInfo();
  }

  @Post('bank-transfer/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads/receipts',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = file.originalname.split('.').pop();
          cb(null, `${uniqueSuffix}.${extension}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload bank transfer receipt',
    description:
      'Uploads proof of bank transfer payment. Creates a pending transaction that requires admin approval.',
  })
  @ApiResponse({
    status: 201,
    description: 'Receipt uploaded successfully',
    schema: {
      example: {
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending',
        message: 'Receipt uploaded successfully. Your payment is pending admin approval.',
        amount: 49.99,
        currency: 'USD',
        receiptUrl: '/uploads/receipts/1234567890-receipt.pdf',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file or data' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to subscription' })
  async uploadBankTransferReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Body() bankTransferUploadDto: BankTransferUploadDto,
    @Request() req,
  ) {
    return this.paymentsService.uploadBankTransferReceipt(
      bankTransferUploadDto,
      req.user.userId,
      file,
    );
  }

  @Get('transactions/:id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get transaction receipt file',
    description: 'Downloads the uploaded receipt file for a bank transfer transaction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt file retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction or receipt not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to transaction' })
  async getTransactionReceipt(
    @Param('id') transactionId: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const receiptInfo = await this.paymentsService.getTransactionReceipt(
      transactionId,
      req.user.userId,
    );

    const filePath = join(process.cwd(), receiptInfo.filePath);
    const file = createReadStream(filePath);

    res.set({
      'Content-Type': receiptInfo.mimeType,
      'Content-Disposition': `attachment; filename="${receiptInfo.fileName}"`,
    });

    return new StreamableFile(file);
  }

  // ==================== STRIPE WEBHOOK ====================

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description:
      'Receives and processes Stripe webhook events (payment_intent.succeeded, payment_intent.failed, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    // Get raw body for webhook signature verification
    const rawBody = request.rawBody;

    if (!rawBody) {
      throw new Error('Raw body is required for webhook signature verification');
    }

    // Verify and construct the event
    const event = this.stripeService.constructWebhookEvent(rawBody as Buffer, signature);

    // Process the event
    return this.paymentsService.handleStripeWebhook(event);
  }

  // ==================== PAYPAL WEBHOOK ====================

  @Post('paypal/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PayPal webhook endpoint',
    description:
      'Receives and processes PayPal webhook events (PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handlePayPalWebhook(@Headers() headers: Record<string, string>, @Body() body: any) {
    return this.paymentsService.handlePayPalWebhook(headers, body);
  }
}
