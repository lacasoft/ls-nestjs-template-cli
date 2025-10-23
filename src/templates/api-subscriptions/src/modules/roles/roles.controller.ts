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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all roles',
  })
  findAllRoles() {
    return this.rolesService.findAllRoles();
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
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Role deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
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
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all permissions',
  })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
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
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Permission deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }
}
