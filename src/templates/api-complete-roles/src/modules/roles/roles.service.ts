import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PaginationDto, PaginatedResult, PaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  // Roles CRUD
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name ${createRoleDto.name} already exists`);
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });

    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({
        id: In(createRoleDto.permissionIds),
      });
      role.permissions = permissions;
    }

    return await this.roleRepository.save(role);
  }

  async findAllRoles(paginationDto?: PaginationDto): Promise<PaginatedResult<Role>> {
    const { skip, take, sortBy, sortOrder } = paginationDto || new PaginationDto();

    const [data, total] = await this.roleRepository.findAndCount({
      relations: ['permissions'],
      skip,
      take,
      order: {
        [sortBy ?? 'createdAt']: sortOrder,
      },
    });

    const meta = new PaginationMeta(total, paginationDto?.page || 1, paginationDto?.limit || 10);

    return { data, meta };
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findRoleById(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(`Role with name ${updateRoleDto.name} already exists`);
      }
    }

    Object.assign(role, {
      name: updateRoleDto.name ?? role.name,
      description: updateRoleDto.description ?? role.description,
    });

    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.findBy({
        id: In(updateRoleDto.permissionIds),
      });
      role.permissions = permissions;
    }

    return await this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    await this.roleRepository.softRemove(role);
  }

  async restoreRole(id: string): Promise<Role> {
    const role = await this.roleRepository
      .createQueryBuilder('role')
      .withDeleted()
      .where('role.id = :id', { id })
      .getOne();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (!role.deletedAt) {
      throw new ConflictException('Role is not deleted');
    }

    await this.roleRepository.restore(id);
    return this.findRoleById(id);
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);
    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds),
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('Some permissions were not found');
    }

    role.permissions = permissions;
    return await this.roleRepository.save(role);
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);
    role.permissions = role.permissions.filter((p) => !permissionIds.includes(p.id));
    return await this.roleRepository.save(role);
  }

  // Permissions CRUD
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Permission with name ${createPermissionDto.name} already exists`,
      );
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async findAllPermissions(paginationDto?: PaginationDto): Promise<PaginatedResult<Permission>> {
    const { skip, take, sortBy, sortOrder } = paginationDto || new PaginationDto();

    const [data, total] = await this.permissionRepository.findAndCount({
      skip,
      take,
      order: {
        [sortBy ?? 'createdAt']: sortOrder,
      },
    });

    const meta = new PaginationMeta(total, paginationDto?.page || 1, paginationDto?.limit || 10);

    return { data, meta };
  }

  async findPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async updatePermission(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findPermissionById(id);

    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: updatePermissionDto.name },
      });

      if (existingPermission) {
        throw new ConflictException(
          `Permission with name ${updatePermissionDto.name} already exists`,
        );
      }
    }

    Object.assign(permission, updatePermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.findPermissionById(id);
    await this.permissionRepository.softRemove(permission);
  }

  async restorePermission(id: string): Promise<Permission> {
    const permission = await this.permissionRepository
      .createQueryBuilder('permission')
      .withDeleted()
      .where('permission.id = :id', { id })
      .getOne();

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    if (!permission.deletedAt) {
      throw new ConflictException('Permission is not deleted');
    }

    await this.permissionRepository.restore(id);
    return this.findPermissionById(id);
  }
}
