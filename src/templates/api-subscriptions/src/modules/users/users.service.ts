import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { PasswordUtil } from '../../common/utils/password.util';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto, _requestingUserId?: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await PasswordUtil.hashPassword(createUserDto.password);

    // SECURITY: Only create user with explicitly allowed fields from DTO
    // Never allow roles to be set through this endpoint to prevent privilege escalation
    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      // roles will be empty by default, preventing creation of super admins
      // Super admins can only be created through the admin endpoint
    });

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUserRoles(savedUser);
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users.map((user) => this.sanitizeUserRoles(user));
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUserRoles(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByAccountId(accountId: string): Promise<User[]> {
    const users = await this.userRepository.findByAccountId(accountId);
    return users.map((user) => this.sanitizeUserRoles(user));
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateData);

    return this.userRepository.save(user);
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: false,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // No permitir que un usuario se elimine a sí mismo
    if (user.id === requestingUserId) {
      throw new ConflictException('You cannot delete your own account');
    }

    // No permitir eliminar al dueño de la cuenta
    if (user.isAccountOwner) {
      throw new ConflictException('Cannot delete the account owner');
    }

    // Soft delete en lugar de hard delete
    await this.userRepository.softDeleteUser(id);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.findOne(userId);
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  /**
   * Sanitiza los roles del usuario, removiendo id y permissions
   */
  private sanitizeUserRoles(user: User): User {
    if (user.roles && Array.isArray(user.roles)) {
      user.roles = user.roles.map((role) => ({
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })) as any;
    }
    return user;
  }
}
