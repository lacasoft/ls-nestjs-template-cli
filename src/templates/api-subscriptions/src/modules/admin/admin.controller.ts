import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { CreateSystemAdminDto } from './dto/create-system-admin.dto';
import { CreatePlanDto } from '../plans/dto/create-plan.dto';
import { UpdatePlanDto } from '../plans/dto/update-plan.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== USERS MANAGEMENT ====================

  @Get('all-users')
  @ApiOperation({ summary: 'Get all users in the system' })
  @ApiResponse({ status: 200, description: 'List of all users in the system' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // ==================== SUPER ADMINS ====================

  @Get('system-admins')
  @ApiOperation({ summary: 'Get all system super admins' })
  @ApiResponse({ status: 200, description: 'List of super admins' })
  async getAllSystemAdmins() {
    return this.adminService.getAllSystemAdmins();
  }

  @Post('system-admins')
  @ApiOperation({ summary: 'Create a new super admin' })
  @ApiResponse({ status: 201, description: 'Super admin created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createSystemAdmin(@Body() createDto: CreateSystemAdminDto) {
    return this.adminService.createSystemAdmin(createDto);
  }

  @Delete('system-admins/:userId')
  @ApiOperation({ summary: 'Delete a super admin' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Super admin deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete last super admin' })
  async deleteSystemAdmin(@Param('userId') userId: string) {
    return this.adminService.deleteSystemAdmin(userId);
  }

  // ==================== PLANS ADMIN ====================

  @Get('plans/all')
  @ApiOperation({ summary: 'Get all plans (including inactive)' })
  @ApiResponse({ status: 200, description: 'List of all plans' })
  async getAllPlans() {
    return this.adminService.getAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 409, description: 'Plan already exists' })
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.adminService.createPlan(createPlanDto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Plan has active subscriptions' })
  async deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  // ==================== PAYMENT APPROVAL ====================

  @Get('pending-payments')
  @ApiOperation({ summary: 'Get all pending payments' })
  @ApiResponse({ status: 200, description: 'List of pending payments' })
  async getPendingPayments() {
    return this.adminService.getPendingPayments();
  }

  @Post('payments/:id/approve')
  @ApiOperation({ summary: 'Approve a payment' })
  @ApiParam({ name: 'id', description: 'Payment Period ID' })
  @ApiResponse({ status: 200, description: 'Payment approved successfully' })
  @ApiResponse({ status: 400, description: 'Payment not in pending status' })
  async approvePayment(@Param('id') id: string) {
    return this.adminService.approvePayment(id);
  }

  @Post('payments/:id/reject')
  @ApiOperation({ summary: 'Reject a payment' })
  @ApiParam({ name: 'id', description: 'Payment Period ID' })
  @ApiResponse({ status: 200, description: 'Payment rejected successfully' })
  async rejectPayment(@Param('id') id: string, @Body() rejectDto: RejectPaymentDto) {
    return this.adminService.rejectPayment(id, rejectDto.reason);
  }

  // ==================== GLOBAL VIEWS ====================

  @Get('all-accounts')
  @ApiOperation({ summary: 'Get all accounts in the system' })
  @ApiResponse({ status: 200, description: 'List of all accounts' })
  async getAllAccounts() {
    return this.adminService.getAllAccounts();
  }

  @Get('all-subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions in the system' })
  @ApiResponse({ status: 200, description: 'List of all subscriptions' })
  async getAllSubscriptions() {
    return this.adminService.getAllSubscriptions();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system-wide metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  // ==================== SYSTEM CONFIG ====================

  @Get('config')
  @ApiOperation({ summary: 'Get system configuration' })
  @ApiResponse({ status: 200, description: 'System configuration' })
  async getSystemConfig() {
    return this.adminService.getSystemConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateSystemConfig(@Body() updateDto: UpdateSystemConfigDto, @Request() req: any) {
    return this.adminService.updateSystemConfig(updateDto, req.user.userId);
  }

  // ==================== BANK TRANSFER APPROVALS ====================

  @Get('pending-bank-transfers')
  @ApiOperation({ summary: 'Get all pending bank transfer transactions' })
  @ApiResponse({ status: 200, description: 'List of pending bank transfers' })
  async getPendingBankTransfers() {
    return this.adminService.getPendingBankTransfers();
  }

  @Post('bank-transfers/:transactionId/approve')
  @ApiOperation({ summary: 'Approve a bank transfer transaction' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Bank transfer approved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Transaction already approved' })
  async approveBankTransfer(@Param('transactionId') transactionId: string, @Request() req) {
    return this.adminService.approveBankTransfer(transactionId, req.user.userId);
  }

  @Post('bank-transfers/:transactionId/reject')
  @ApiOperation({ summary: 'Reject a bank transfer transaction' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Bank transfer rejected successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async rejectBankTransfer(
    @Param('transactionId') transactionId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.adminService.rejectBankTransfer(transactionId, req.user.userId, reason);
  }

  // ==================== REFUNDS ====================

  @Post('refunds')
  @ApiOperation({ summary: 'Process a refund for a transaction' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or cannot refund transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async processRefund(
    @Body() refundDto: { transactionId: string; amount?: number; reason: string; notes?: string },
    @Request() req,
  ) {
    return this.adminService.processRefund(
      refundDto.transactionId,
      req.user.userId,
      refundDto.amount,
      refundDto.reason,
      refundDto.notes,
    );
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLogs({ userId, action, entity, limit });
  }
}
