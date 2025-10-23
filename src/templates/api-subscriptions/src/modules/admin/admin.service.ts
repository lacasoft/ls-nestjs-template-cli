import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserRepository } from '../users/repositories/user.repository';
import { PlanRepository } from '../plans/repositories/plan.repository';
import { AccountRepository } from '../accounts/repositories/account.repository';
import { SubscriptionRepository } from '../subscriptions/repositories/subscription.repository';
import { PaymentPeriodRepository } from '../subscriptions/repositories/payment-period.repository';
import { SystemConfigRepository } from '../system-config/repositories/system-config.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { RolesService } from '../roles/roles.service';
import { AuditService } from '../audit/audit.service';
import { PaymentsService } from '../payments/services/payments.service';
import { TransactionRepository } from '../payments/repositories/transaction.repository';
import { PaymentMethod, TransactionStatus } from '../payments/entities/transaction.entity';
import { CreateSystemAdminDto } from './dto/create-system-admin.dto';
import { CreatePlanDto } from '../plans/dto/create-plan.dto';
import { UpdatePlanDto } from '../plans/dto/update-plan.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { RoleType } from '../roles/entities/role.entity';
import { PaymentPeriodStatus } from '../subscriptions/entities/payment-period.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly SYSTEM_CONFIG_CACHE_KEY = 'system_config';
  private readonly CACHE_TTL = 300000; // 5 minutos

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly userRepository: UserRepository,
    private readonly planRepository: PlanRepository,
    private readonly accountRepository: AccountRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentPeriodRepository: PaymentPeriodRepository,
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly systemConfigService: SystemConfigService,
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  // ==================== USERS MANAGEMENT ====================

  async getAllUsers() {
    return this.userRepository.find({
      relations: ['roles', 'account'],
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== SUPER ADMINS ====================

  async getAllSystemAdmins() {
    const users = await this.userRepository.find({
      relations: ['roles'],
    });

    return users.filter((user) => user.roles?.some((role) => role.name === RoleType.SUPER_ADMIN));
  }

  async createSystemAdmin(createDto: CreateSystemAdminDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get super_admin role
    const roles = await this.rolesService.findAllRoles();
    const superAdminRole = roles.find((r) => r.name === RoleType.SUPER_ADMIN);

    if (!superAdminRole) {
      throw new NotFoundException('Super admin role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: createDto.email,
      password: hashedPassword,
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      isActive: true,
      roles: [superAdminRole],
    });

    return this.userRepository.save(user);
  }

  async deleteSystemAdmin(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSuperAdmin = user.roles?.some((role) => role.name === RoleType.SUPER_ADMIN);

    if (!isSuperAdmin) {
      throw new BadRequestException('User is not a super admin');
    }

    // Count remaining super admins
    const allSuperAdmins = await this.getAllSystemAdmins();
    if (allSuperAdmins.length <= 1) {
      throw new BadRequestException('Cannot delete the last super admin');
    }

    await this.userRepository.softDeleteUser(userId);
    return { message: 'Super admin deleted successfully' };
  }

  // ==================== PLANS ADMIN ====================

  async getAllPlans() {
    return this.planRepository.find({
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async createPlan(createPlanDto: CreatePlanDto) {
    // Check if plan with same name or code exists
    const existing = await this.planRepository.findOne({
      where: [{ name: createPlanDto.name }, { code: createPlanDto.code }],
    });

    if (existing) {
      throw new ConflictException('Plan with this name or code already exists');
    }

    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto) {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async deletePlan(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { planId: id },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${activeSubscriptions} active subscription(s)`,
      );
    }

    await this.planRepository.delete(id);
    return { message: 'Plan deleted successfully' };
  }

  // ==================== PAYMENT APPROVAL ====================

  async getPendingPayments() {
    return this.paymentPeriodRepository.find({
      where: { status: PaymentPeriodStatus.PENDING },
      relations: ['subscription', 'subscription.account', 'subscription.plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async approvePayment(paymentId: string) {
    const payment = await this.paymentPeriodRepository.findOne({
      where: { id: paymentId },
      relations: ['subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentPeriodStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    payment.status = PaymentPeriodStatus.PAID;
    payment.paidAt = new Date();

    await this.paymentPeriodRepository.save(payment);

    return {
      message: 'Payment approved successfully',
      payment,
    };
  }

  async rejectPayment(paymentId: string, reason?: string) {
    const payment = await this.paymentPeriodRepository.findOne({
      where: { id: paymentId },
      relations: ['subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentPeriodStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    payment.status = PaymentPeriodStatus.FAILED;

    await this.paymentPeriodRepository.save(payment);

    return {
      message: 'Payment rejected successfully',
      reason: reason || 'Rejected by admin',
      payment,
    };
  }

  // ==================== GLOBAL VIEWS ====================

  async getAllAccounts() {
    return this.accountRepository.find({
      relations: ['users', 'subscriptions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllSubscriptions() {
    return this.subscriptionRepository.find({
      relations: ['account', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMetrics() {
    const [totalAccounts, totalUsers, totalPlans, activeSubscriptions, pendingPayments] =
      await Promise.all([
        this.accountRepository.count(),
        this.userRepository.count(),
        this.planRepository.count(),
        this.subscriptionRepository.count({ where: { status: 'active' as any } }),
        this.paymentPeriodRepository.count({ where: { status: PaymentPeriodStatus.PENDING } }),
      ]);

    // Revenue calculation (simplified)
    const allPayments = await this.paymentPeriodRepository.find({
      where: { status: PaymentPeriodStatus.PAID },
    });

    const totalRevenue = allPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount.toString()),
      0,
    );

    return {
      totalAccounts,
      totalUsers,
      totalPlans,
      activeSubscriptions,
      pendingPayments,
      totalRevenue,
      metrics: {
        accountsGrowth: 0, // TODO: Implement growth calculation
        subscriptionsGrowth: 0,
        revenueGrowth: 0,
      },
    };
  }

  // ==================== SYSTEM CONFIG ====================

  async getSystemConfig() {
    // Try to get from cache first
    const config = await this.cacheManager.get(this.SYSTEM_CONFIG_CACHE_KEY);

    if (config) {
      // Return cached version
      return config;
    }

    // Not in cache, fetch from database
    const configs = await this.systemConfigRepository.getAllConfigs();

    // Transform array of config entries into an object structure
    const configObject: any = {};

    for (const config of configs) {
      // Parse value based on type
      let value: any = config.value;
      if (config.type === 'number') {
        value = parseFloat(config.value);
      } else if (config.type === 'boolean') {
        value = config.value === 'true';
      } else if (config.type === 'json') {
        try {
          value = JSON.parse(config.value);
        } catch {
          value = config.value;
        }
      }

      // Convert snake_case keys to camelCase
      const camelKey = config.key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      configObject[camelKey] = value;
    }

    // Build features object from specific config keys
    const features: any = {};
    if (configObject.enableEmailNotifications !== undefined) {
      features.emailNotifications = configObject.enableEmailNotifications;
      delete configObject.enableEmailNotifications;
    }
    if (configObject.enablePushNotifications !== undefined) {
      features.smsNotifications = configObject.enablePushNotifications;
      delete configObject.enablePushNotifications;
    }

    // Add features to config if any exist
    if (Object.keys(features).length > 0) {
      configObject.features = features;
    }

    // Store in cache for future requests
    await this.cacheManager.set(this.SYSTEM_CONFIG_CACHE_KEY, configObject, this.CACHE_TTL);

    return configObject;
  }

  async updateSystemConfig(updateDto: UpdateSystemConfigDto, userId: string) {
    // Get current config for audit log
    const oldConfig = await this.getSystemConfig();

    // Convert incoming camelCase to snake_case and update
    const updates: Array<{ key: string; value: string }> = [];

    if (updateDto.defaultCurrency !== undefined) {
      updates.push({ key: 'default_currency', value: updateDto.defaultCurrency });
    }
    if (updateDto.trialDaysDefault !== undefined) {
      updates.push({ key: 'trial_days_default', value: String(updateDto.trialDaysDefault) });
    }
    if (updateDto.maintenanceMode !== undefined) {
      updates.push({ key: 'maintenance_mode', value: String(updateDto.maintenanceMode) });
    }
    if (updateDto.maxFailedLoginAttempts !== undefined) {
      updates.push({
        key: 'max_failed_login_attempts',
        value: String(updateDto.maxFailedLoginAttempts),
      });
    }

    // Update each config value in database
    for (const { key, value } of updates) {
      await this.systemConfigRepository.setConfig(key, value);
    }

    // IMPORTANT: Invalidate both admin and public caches after updating
    await this.cacheManager.del(this.SYSTEM_CONFIG_CACHE_KEY);
    await this.systemConfigService.invalidatePublicCache();

    // Return updated config (this will rebuild the cache)
    const updatedConfig = await this.getSystemConfig();

    // Log the change to audit log
    await this.auditService.logSystemConfigChange(userId, oldConfig, updatedConfig);

    return {
      message: 'System configuration updated successfully',
      config: updatedConfig,
    };
  }

  // ==================== BANK TRANSFER APPROVALS ====================

  async getPendingBankTransfers() {
    const pendingTransactions = await this.transactionRepository.find({
      where: {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: TransactionStatus.PENDING,
      },
      relations: ['user', 'subscription', 'subscription.plan'],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      transactions: pendingTransactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        referenceNumber: transaction.bankTransferReference,
        receiptUrl: transaction.bankTransferProofUrl,
        user: {
          id: transaction.user.id,
          email: transaction.user.email,
          firstName: transaction.user.firstName,
          lastName: transaction.user.lastName,
        },
        subscription: {
          id: transaction.subscription?.id,
          plan: {
            id: transaction.subscription?.plan?.id,
            name: transaction.subscription?.plan?.name,
            price: transaction.subscription?.plan?.price,
          },
        },
        notes: transaction.metadata?.notes,
        createdAt: transaction.createdAt,
      })),
      total: pendingTransactions.length,
    };
  }

  async approveBankTransfer(transactionId: string, adminUserId: string) {
    return this.paymentsService.approveBankTransfer(transactionId, adminUserId);
  }

  async rejectBankTransfer(transactionId: string, adminUserId: string, reason: string) {
    return this.paymentsService.rejectBankTransfer(transactionId, adminUserId, reason);
  }

  // ==================== AUDIT LOGS ====================

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    entity?: string;
    limit?: number;
  }) {
    return this.auditService.getAuditLogs(filters);
  }

  // ==================== REFUNDS ====================

  /**
   * Process refund (delegates to PaymentsService)
   */
  async processRefund(
    transactionId: string,
    adminUserId: string,
    amount?: number,
    reason?: string,
    notes?: string,
  ) {
    return this.paymentsService.refundTransaction(
      transactionId,
      adminUserId,
      amount,
      reason,
      notes,
    );
  }
}
