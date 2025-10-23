import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service';
import { RoleType } from '../../modules/roles/entities/role.entity';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user with roles
    const fullUser = await this.usersService.findOne(user.userId);

    if (!fullUser) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has SUPER_ADMIN role
    const isSuperAdmin = fullUser.roles?.some((role) => role.name === RoleType.SUPER_ADMIN);

    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this resource');
    }

    return true;
  }
}
