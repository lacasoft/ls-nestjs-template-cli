import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserLocationRepository } from './repositories/user-location.repository';
import { LocationRepository } from './repositories/location.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { InvitationsService } from '../invitations/invitations.service';
import { InviteUserToLocationDto } from './dto/invite-user-to-location.dto';
import { UpdateUserLocationRoleDto } from './dto/update-user-location-role.dto';
import { UserLocation, LocationRoleType } from './entities/user-location.entity';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class LocationUsersService {
  constructor(
    private readonly userLocationRepository: UserLocationRepository,
    private readonly locationRepository: LocationRepository,
    private readonly userRepository: UserRepository,
    private readonly invitationsService: InvitationsService,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * Get all users assigned to a specific location
   */
  async getUsersByLocation(locationId: string, requestingUserId: string): Promise<UserLocation[]> {
    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Verify requesting user has access to this location
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
      relations: ['roles'],
    });

    if (!requestingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user has access to this location
    await this.verifyUserAccessToLocation(requestingUserId, locationId, location.accountId);

    return this.userLocationRepository.findByLocationId(locationId);
  }

  /**
   * Invite a user to a location with a specific role
   */
  async inviteUserToLocation(
    locationId: string,
    inviteDto: InviteUserToLocationDto,
    requestingUserId: string,
  ): Promise<{ message: string; invitationId?: string }> {
    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Verify requesting user has permission to invite users
    await this.verifyUserCanManageLocation(requestingUserId, locationId, location.accountId);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteDto.email },
    });

    if (existingUser) {
      // User exists, check if already assigned to this location
      const existingAssignment = await this.userLocationRepository.findByUserAndLocation(
        existingUser.id,
        locationId,
      );

      if (existingAssignment) {
        throw new ConflictException('User is already assigned to this location');
      }

      // Verify user belongs to the same account
      if (existingUser.accountId !== location.accountId) {
        throw new ForbiddenException('User does not belong to the same account');
      }

      // Assign user to location
      const userLocation = this.userLocationRepository.create({
        userId: existingUser.id,
        locationId: location.id,
        role: inviteDto.role,
        isActive: true,
      });

      await this.userLocationRepository.save(userLocation);

      return {
        message: 'User assigned to location successfully',
      };
    }

    // User doesn't exist, create invitation
    // Get role ID if not provided
    let roleId = inviteDto.roleId;
    if (!roleId) {
      // Find a default role (observer) for the invitation
      const roles = await this.rolesService.findAllRoles();
      const defaultRole = roles.find((r) => r.name === ('observer' as any));
      if (defaultRole) {
        roleId = defaultRole.id;
      }
    }

    if (!roleId) {
      throw new BadRequestException('Role ID is required for new user invitation');
    }

    // Create invitation with location metadata
    const invitation = await this.invitationsService.createInvitation(
      location.accountId,
      inviteDto.email,
      roleId,
      requestingUserId,
    );

    // TODO: Store location assignment in invitation metadata or separate table
    // For now, we'll need to handle this after the user accepts the invitation

    return {
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
    };
  }

  /**
   * Update a user's role in a specific location
   */
  async updateUserLocationRole(
    locationId: string,
    userId: string,
    updateDto: UpdateUserLocationRoleDto,
    requestingUserId: string,
  ): Promise<UserLocation> {
    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Verify requesting user has permission to manage users
    await this.verifyUserCanManageLocation(requestingUserId, locationId, location.accountId);

    // Find user-location assignment
    const userLocation = await this.userLocationRepository.findByUserAndLocation(
      userId,
      locationId,
    );

    if (!userLocation) {
      throw new NotFoundException('User is not assigned to this location');
    }

    // Prevent changing own role if not admin_root
    if (userId === requestingUserId) {
      const requestingUserLocation = await this.userLocationRepository.findByUserAndLocation(
        requestingUserId,
        locationId,
      );

      if (
        requestingUserLocation?.role !== LocationRoleType.ADMIN_ROOT &&
        updateDto.role !== userLocation.role
      ) {
        throw new ForbiddenException('You cannot change your own role');
      }
    }

    // Update role
    userLocation.role = updateDto.role;
    return this.userLocationRepository.save(userLocation);
  }

  /**
   * Remove a user from a location
   */
  async removeUserFromLocation(
    locationId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<{ message: string }> {
    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Verify requesting user has permission to manage users
    await this.verifyUserCanManageLocation(requestingUserId, locationId, location.accountId);

    // Find user-location assignment
    const userLocation = await this.userLocationRepository.findByUserAndLocation(
      userId,
      locationId,
    );

    if (!userLocation) {
      throw new NotFoundException('User is not assigned to this location');
    }

    // Prevent removing self unless admin_root
    if (userId === requestingUserId) {
      const requestingUserLocation = await this.userLocationRepository.findByUserAndLocation(
        requestingUserId,
        locationId,
      );

      if (requestingUserLocation?.role !== LocationRoleType.ADMIN_ROOT) {
        throw new ForbiddenException('You cannot remove yourself from this location');
      }
    }

    // Remove user from location
    await this.userLocationRepository.removeUserFromLocation(userId, locationId);

    return { message: 'User removed from location successfully' };
  }

  /**
   * Verify if a user has access to view a location
   */
  private async verifyUserAccessToLocation(
    userId: string,
    locationId: string,
    accountId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is account owner
    if (user.isAccountOwner && user.accountId === accountId) {
      return; // Account owner has access to all locations
    }

    // Check if user is assigned to this location
    const userLocation = await this.userLocationRepository.findByUserAndLocation(
      userId,
      locationId,
    );

    if (!userLocation) {
      throw new ForbiddenException('You do not have access to this location');
    }

    // Check if user is admin_root (can access all locations in account)
    const userLocations = await this.userLocationRepository.findByUserId(userId);
    const hasAdminRoot = userLocations.some((ul) => ul.role === LocationRoleType.ADMIN_ROOT);

    if (hasAdminRoot) {
      return;
    }

    // User must be assigned to this specific location
    if (!userLocation.isActive) {
      throw new ForbiddenException('Your access to this location is inactive');
    }
  }

  /**
   * Verify if a user can manage a location (invite, change roles, remove users)
   */
  private async verifyUserCanManageLocation(
    userId: string,
    locationId: string,
    accountId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is account owner
    if (user.isAccountOwner && user.accountId === accountId) {
      return; // Account owner can manage all locations
    }

    // Check user's role in locations
    const userLocations = await this.userLocationRepository.findByUserId(userId);

    // Check if user is admin_root
    const hasAdminRoot = userLocations.some(
      (ul) => ul.role === LocationRoleType.ADMIN_ROOT && ul.isActive,
    );

    if (hasAdminRoot) {
      return; // Admin root can manage all locations in account
    }

    // Check if user is admin_local for this specific location
    const userLocation = await this.userLocationRepository.findByUserAndLocation(
      userId,
      locationId,
    );

    if (!userLocation || !userLocation.isActive) {
      throw new ForbiddenException('You do not have permission to manage this location');
    }

    if (
      userLocation.role !== LocationRoleType.ADMIN_LOCAL &&
      userLocation.role !== LocationRoleType.ADMIN_ROOT
    ) {
      throw new ForbiddenException('You do not have permission to manage this location');
    }
  }
}
