import {
  Controller,
  Get,
  Put,
  Body,
  Request,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user account' })
  @ApiResponse({ status: 200, description: 'Returns account information' })
  @ApiResponse({ status: 404, description: 'User has no account assigned' })
  async getMyAccount(@Request() req): Promise<Account> {
    const userId = req.user.userId;

    // Obtener el usuario con su relación de cuenta
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.accountsService.findOne(user.accountId);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'User has no account assigned' })
  async updateMyAccount(
    @Request() req,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    const userId = req.user.userId;

    // Get user with account
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.accountsService.update(user.accountId, updateAccountDto);
  }
}
