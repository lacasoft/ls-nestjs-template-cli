import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Inject,
  Delete,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req: AuthenticatedRequest) {
    // Only authenticated users can create users
    // Roles cannot be assigned through this endpoint - use admin endpoints for that
    const requestingUserId = req.user.userId;
    const user = await this.usersService.create(createUserDto, requestingUserId);

    // Invalidar caché de lista de usuarios
    await this.cacheManager.del('users_all');

    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Get all members of the current user account' })
  @ApiResponse({ status: 200, description: 'Returns list of account members' })
  @ApiResponse({ status: 404, description: 'User has no account assigned' })
  async findAll(@Request() req: AuthenticatedRequest) {
    // SECURITY: Regular users can only see members of their own account
    // Super admins should use GET /admin/all-users to see all system users
    const userId = req.user.userId;
    const currentUser = await this.usersService.findOne(userId);

    if (!currentUser.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.usersService.findByAccountId(currentUser.accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete('members/:userId')
  @ApiOperation({ summary: 'Delete a member from the account' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete account owner or self' })
  async deleteMember(@Request() req: AuthenticatedRequest, @Param('userId') userId: string) {
    const requestingUserId = req.user.userId;

    await this.usersService.remove(userId, requestingUserId);

    return { message: 'Member deleted successfully' };
  }
}
