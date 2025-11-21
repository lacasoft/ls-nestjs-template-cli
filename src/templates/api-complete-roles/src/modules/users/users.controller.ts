import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Inject,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { REGISTER_THROTTLE_CONFIG } from '../../common/constants/throttle.constants';
import { UsersCacheKeys } from './constants/cache-keys.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Public()
  @Throttle(REGISTER_THROTTLE_CONFIG)
  @Post()
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user. Optionally assign roles by providing roleIds array.',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role IDs provided' })
  @ApiResponse({
    status: 403,
    description: 'Cannot create super_admin user when one already exists',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    // Invalidar caché de lista de usuarios
    await this.cacheManager.del(UsersCacheKeys.ALL);

    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(userId, updateProfileDto);

    // Invalidar caché del usuario
    await this.cacheManager.del(UsersCacheKeys.ALL);
    await this.cacheManager.del(UsersCacheKeys.ONE(userId));

    return user;
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, changePasswordDto);
    return { message: 'Password updated successfully' };
  }

  @Get('me/permissions')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
  @ApiOperation({
    summary: 'Get current user permissions',
    description:
      'Returns all permissions for the authenticated user, including roles and permissions grouped by resource. This endpoint is cached for 5 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user permissions with roles and grouped permissions',
    type: UserPermissionsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  async getPermissions(@CurrentUser('userId') userId: string): Promise<UserPermissionsResponseDto> {
    return this.usersService.getUserPermissions(userId);
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({ status: 200, description: 'Returns user preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@CurrentUser('userId') userId: string) {
    return this.usersService.getPreferences(userId);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser('userId') userId: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(userId, updatePreferencesDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
