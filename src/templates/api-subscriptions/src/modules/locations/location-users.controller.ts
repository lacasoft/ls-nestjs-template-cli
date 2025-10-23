import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LocationUsersService } from './location-users.service';
import { InviteUserToLocationDto } from './dto/invite-user-to-location.dto';
import { UpdateUserLocationRoleDto } from './dto/update-user-location-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserLocation } from './entities/user-location.entity';

@ApiTags('Location Users')
@ApiBearerAuth()
@Controller('locations/:locationId/users')
@UseGuards(JwtAuthGuard)
export class LocationUsersController {
  constructor(private readonly locationUsersService: LocationUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users assigned to a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of users in the location',
    type: [UserLocation],
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({
    status: 403,
    description: 'User does not have access to this location',
  })
  async getUsersByLocation(
    @Param('locationId') locationId: string,
    @Request() req,
  ): Promise<UserLocation[]> {
    const userId = req.user.userId;
    return this.locationUsersService.getUsersByLocation(locationId, userId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a user to a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiResponse({
    status: 201,
    description: 'User invited or assigned successfully',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to invite users',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already assigned to this location',
  })
  async inviteUserToLocation(
    @Param('locationId') locationId: string,
    @Body() inviteDto: InviteUserToLocationDto,
    @Request() req,
  ): Promise<{ message: string; invitationId?: string }> {
    const userId = req.user.userId;
    return this.locationUsersService.inviteUserToLocation(locationId, inviteDto, userId);
  }

  @Put(':userId/role')
  @ApiOperation({ summary: "Update a user's role in a location" })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserLocation,
  })
  @ApiResponse({ status: 404, description: 'Location or user not found' })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to change roles',
  })
  async updateUserRole(
    @Param('locationId') locationId: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserLocationRoleDto,
    @Request() req,
  ): Promise<UserLocation> {
    const requestingUserId = req.user.userId;
    return this.locationUsersService.updateUserLocationRole(
      locationId,
      userId,
      updateDto,
      requestingUserId,
    );
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a user from a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User removed from location successfully',
  })
  @ApiResponse({ status: 404, description: 'Location or user not found' })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to remove users',
  })
  async removeUserFromLocation(
    @Param('locationId') locationId: string,
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    const requestingUserId = req.user.userId;
    return this.locationUsersService.removeUserFromLocation(locationId, userId, requestingUserId);
  }
}
