import { Controller, Get, Post, Body, Request, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { PaymentPeriod } from './entities/payment-period.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/services/payments.service';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { DowngradeSubscriptionDto } from './dto/downgrade-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('me')
  async getMySubscription(@Request() req): Promise<Subscription> {
    const userId = req.user.userId;

    // Obtener el usuario con su relación de cuenta
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.subscriptionsService.findByAccountId(user.accountId);
  }

  @Get('periods')
  async getMyPaymentPeriods(@Request() req): Promise<PaymentPeriod[]> {
    const userId = req.user.userId;

    // Obtener el usuario con su relación de cuenta
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    // Obtener la suscripción del usuario
    const subscription = await this.subscriptionsService.findByAccountId(user.accountId);

    // Obtener los periodos de pago
    return this.subscriptionsService.findPaymentPeriodsBySubscriptionId(subscription.id);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription to higher tier plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgrade scheduled successfully with payment links',
  })
  @ApiResponse({ status: 400, description: 'Invalid upgrade request' })
  @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
  async upgradeSubscription(@Body() upgradeDto: UpgradeSubscriptionDto, @Request() req) {
    const userId = req.user.userId;
    const upgradeResult = await this.subscriptionsService.upgradeSubscription(upgradeDto, userId);

    // Generate payment links for the upgrade
    const paymentLinks = await this.paymentsService.generatePaymentLinksForUpgrade(
      upgradeResult.subscription.id,
      upgradeResult.newPlan.id,
      userId,
      Number(upgradeResult.newPlan.price),
      `Upgrade to ${upgradeResult.newPlan.name} plan`,
    );

    return {
      message: upgradeResult.message,
      subscription: upgradeResult.subscription,
      paymentPeriod: upgradeResult.paymentPeriod,
      newPlan: upgradeResult.newPlan,
      paymentLinks,
    };
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Downgrade subscription to lower tier plan' })
  @ApiResponse({ status: 200, description: 'Subscription downgrade scheduled successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid downgrade request or usage exceeds new plan limits',
  })
  @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
  async downgradeSubscription(
    @Body() downgradeDto: DowngradeSubscriptionDto,
    @Request() req,
  ): Promise<{ message: string; subscription: Subscription }> {
    const userId = req.user.userId;
    return this.subscriptionsService.downgradeSubscription(downgradeDto, userId);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(
    @Body() cancelDto: CancelSubscriptionDto,
    @Request() req,
  ): Promise<{ message: string; subscription: Subscription }> {
    const userId = req.user.userId;
    return this.subscriptionsService.cancelSubscription(cancelDto, userId);
  }
}
