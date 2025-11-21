import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions-response.dto';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserRepository } from './repositories/user.repository';
import { PasswordUtil } from '../../common/utils/password.util';
import { Role, RoleType } from '../roles/entities/role.entity';
import { Permission } from '../roles/entities/permission.entity';
import { PaginationDto, PaginatedResult, PaginationMeta } from '../../common/dto/pagination.dto';
import { UsersCacheKeys } from './constants/cache-keys.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private userRepository: UserRepository,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // If roles are provided, validate and fetch them
    let roles: Role[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.findByIds(createUserDto.roleIds);

      if (roles.length !== createUserDto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }

      // Check if trying to assign super_admin role
      const hasSuperAdminRole = roles.some((role) => role.name === RoleType.SUPER_ADMIN);

      if (hasSuperAdminRole) {
        // Check if super_admin already exists
        const existingSuperAdmin = await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.roles', 'role')
          .where('role.name = :roleName', { roleName: RoleType.SUPER_ADMIN })
          .getOne();

        if (existingSuperAdmin) {
          throw new ForbiddenException(
            'Cannot create user with super_admin role. A super admin already exists in the system.',
          );
        }
      }
    }

    const hashedPassword = await PasswordUtil.hashPassword(createUserDto.password);

    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      roles: roles.length > 0 ? roles : undefined,
    });

    return this.userRepository.save(user);
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<User>> {
    const { skip, take, sortBy, sortOrder } = paginationDto || new PaginationDto();

    const [data, total] = await this.userRepository.findAndCount({
      relations: ['roles', 'roles.permissions'],
      skip,
      take,
      order: {
        [sortBy ?? 'createdAt']: sortOrder,
      },
    });

    const meta = new PaginationMeta(total, paginationDto?.page || 1, paginationDto?.limit || 10);

    return { data, meta };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'preferences'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }

    if (updateProfileDto.lastName !== undefined) {
      user.lastName = updateProfileDto.lastName;
    }

    if (updateProfileDto.phone !== undefined) {
      user.phone = updateProfileDto.phone;
    }

    return this.userRepository.save(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await PasswordUtil.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await PasswordUtil.hashPassword(changePasswordDto.newPassword);
    user.password = hashedPassword;

    await this.userRepository.save(user);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      // Defaults are defined in UserPreferences entity
      preferences = this.preferencesRepository.create({
        userId,
      });
      await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        ...updatePreferencesDto,
      });
    } else {
      Object.assign(preferences, updatePreferencesDto);
    }

    return this.preferencesRepository.save(preferences);
  }

  private async isLastSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.roles', 'role')
      .where('user.id = :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      return false;
    }

    // Check if user has super_admin role
    const isSuperAdmin = user.roles?.some((role) => role.name === RoleType.SUPER_ADMIN);

    if (!isSuperAdmin) {
      return false;
    }

    // Count active super admins
    const activeSuperAdminsCount = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName: RoleType.SUPER_ADMIN })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getCount();

    return activeSuperAdminsCount === 1;
  }

  /**
   * Deactivate a user account
   * Prevents deactivation of the last super admin
   */
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.isActive) {
      throw new BadRequestException('User is already deactivated');
    }

    // Prevent deactivation of last super admin
    if (await this.isLastSuperAdmin(userId)) {
      this.logger.warn(`Attempted to deactivate last super admin: ${user.email} (ID: ${userId})`);
      throw new ForbiddenException(
        'Cannot deactivate the last super admin. Please create another super admin first.',
      );
    }

    user.isActive = false;

    this.logger.log(`User deactivated: ${user.email} (ID: ${userId})`);

    return this.userRepository.save(user);
  }

  /**
   * Reactivate a user account
   */
  async activateUser(userId: string): Promise<User> {
    const user = await this.findOne(userId);

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    user.isActive = true;

    this.logger.log(`User activated: ${user.email} (ID: ${userId})`);

    return this.userRepository.save(user);
  }

  /**
   * Soft delete a user
   * Prevents deletion of the last super admin
   */
  async removeUser(userId: string): Promise<void> {
    const user = await this.findOne(userId);

    // Prevent deletion of last super admin
    if (await this.isLastSuperAdmin(userId)) {
      this.logger.warn(`Attempted to delete last super admin: ${user.email} (ID: ${userId})`);
      throw new ForbiddenException(
        'Cannot delete the last super admin. Please create another super admin first.',
      );
    }

    await this.userRepository.softRemove(user);

    this.logger.log(`User deleted (soft): ${user.email} (ID: ${userId})`);
  }

  async getUserPermissions(userId: string): Promise<UserPermissionsResponseDto> {
    // Security: Validate user ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Check cache first
    const cacheKey = UsersCacheKeys.PERMISSIONS(userId);
    const cached = await this.cacheManager.get<UserPermissionsResponseDto>(cacheKey);

    if (cached) {
      this.logger.debug(`Permissions cache hit for user: ${userId}`);
      return {
        ...cached,
        cached: true,
      };
    }

    // Cache miss - fetch from database
    this.logger.debug(`Permissions cache miss for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found or inactive');
    }

    // Extract and process permissions
    const allPermissions: Permission[] = [];
    const permissionNames = new Set<string>();
    const permissionsByResource: Record<string, Set<string>> = {};

    // Process roles and permissions
    const roles = (user.roles || [])
      .filter((role) => role.isActive)
      .map((role) => ({
        name: role.name,
        description: role.description,
      }));

    // Collect all permissions from all roles
    (user.roles || []).forEach((role) => {
      if (!role.isActive) return;

      (role.permissions || []).forEach((permission) => {
        if (!permission.isActive) return;

        // Avoid duplicates
        if (!permissionNames.has(permission.name)) {
          allPermissions.push(permission);
          permissionNames.add(permission.name);

          // Group by resource
          if (permission.resource && permission.action) {
            if (!permissionsByResource[permission.resource]) {
              permissionsByResource[permission.resource] = new Set<string>();
            }
            permissionsByResource[permission.resource].add(permission.action);
          }
        }
      });
    });

    // Convert permissions to DTO format
    const permissions = allPermissions.map((p) => ({
      name: p.name,
      description: p.description,
      resource: p.resource,
      action: p.action,
    }));

    // Convert Sets to Arrays for JSON serialization
    const permissionsByResourceArray: Record<string, string[]> = {};
    Object.keys(permissionsByResource).forEach((resource) => {
      permissionsByResourceArray[resource] = Array.from(permissionsByResource[resource]);
    });

    const response: UserPermissionsResponseDto = {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
      permissionNames: Array.from(permissionNames),
      permissionsByResource: permissionsByResourceArray,
      timestamp: new Date(),
      cached: false,
    };

    // Store in cache (TTL from configuration, default 5 minutes)
    const cacheTTL = this.configService.get<number>('app.permissionsCacheTTL', 300000);
    await this.cacheManager.set(cacheKey, response, cacheTTL);

    // ALSO cache the permission names array separately for PermissionsGuard
    // This allows the guard to quickly check permissions without deserializing the full response
    const permissionsArrayKey = `user:${userId}:permissions`;
    await this.cacheManager.set(permissionsArrayKey, Array.from(permissionNames), cacheTTL);

    this.logger.debug(`Permissions cached for user: ${userId}`);

    return response;
  }

  async invalidatePermissionsCache(userId: string): Promise<void> {
    const cacheKey = UsersCacheKeys.PERMISSIONS(userId);
    const permissionsArrayKey = `user:${userId}:permissions`;
    await this.cacheManager.del(cacheKey);
    await this.cacheManager.del(permissionsArrayKey);
    this.logger.log(`Permissions cache invalidated for user: ${userId}`);
  }

  async invalidatePermissionsCacheByRole(roleId: string): Promise<void> {
    // Find all users with this role
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .select(['user.id'])
      .getMany();

    // Invalidate cache for each user
    await Promise.all(users.map((user) => this.invalidatePermissionsCache(user.id)));

    this.logger.log(`Permissions cache invalidated for ${users.length} users with role: ${roleId}`);
  }
}
