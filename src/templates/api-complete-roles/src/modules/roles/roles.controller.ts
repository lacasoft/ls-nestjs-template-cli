import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from './entities/role.entity';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Roles endpoints
  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role created successfully',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Role already exists' })
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.SUPERVISOR)
  @ApiOperation({ summary: 'Get all roles with pagination' })
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
    status: HttpStatus.OK,
    description: 'Returns paginated list of roles',
  })
  findAllRoles(@Query() paginationDto: PaginationDto) {
    return this.rolesService.findAllRoles(paginationDto);
  }

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.SUPERVISOR)
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns role details',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  findRoleById(@Param('id') id: string) {
    return this.rolesService.findRoleById(id);
  }

  @Patch(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Role soft deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Patch(':id/restore')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role restored successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Role is not deleted' })
  restoreRole(@Param('id') id: string) {
    return this.rolesService.restoreRole(id);
  }

  @Post(':id/permissions')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions assigned successfully',
  })
  assignPermissions(@Param('id') id: string, @Body() assignPermissionsDto: AssignPermissionsDto) {
    return this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }

  @Delete(':id/permissions')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Remove permissions from role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions removed successfully',
  })
  removePermissions(@Param('id') id: string, @Body() assignPermissionsDto: AssignPermissionsDto) {
    return this.rolesService.removePermissions(id, assignPermissionsDto.permissionIds);
  }

  // Permissions endpoints
  @Post('permissions')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Permission created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Permission already exists',
  })
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get('permissions/all')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.SUPERVISOR)
  @ApiOperation({ summary: 'Get all permissions with pagination' })
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
    status: HttpStatus.OK,
    description: 'Returns paginated list of permissions',
  })
  findAllPermissions(@Query() paginationDto: PaginationDto) {
    return this.rolesService.findAllPermissions(paginationDto);
  }

  @Get('permissions/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.SUPERVISOR)
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns permission details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  findPermissionById(@Param('id') id: string) {
    return this.rolesService.findPermissionById(id);
  }

  @Patch('permissions/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  updatePermission(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.rolesService.updatePermission(id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  @Roles(RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a permission' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Permission soft deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }

  @Patch('permissions/:id/restore')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted permission' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission restored successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Permission is not deleted' })
  restorePermission(@Param('id') id: string) {
    return this.rolesService.restorePermission(id);
  }
}
