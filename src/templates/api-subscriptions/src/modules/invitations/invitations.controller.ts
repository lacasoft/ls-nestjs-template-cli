import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { InviteDto } from './dto/invite.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationToken } from './entities/invitation-token.entity';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/repositories/user.repository';
import { PasswordUtil } from '../../common/utils/password.util';

@Controller('users/members')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly usersService: UsersService,
    private readonly userRepository: UserRepository,
    private readonly accountsService: AccountsService,
  ) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  async inviteMember(@Request() req, @Body() inviteDto: InviteDto): Promise<InvitationToken> {
    const userId = req.user.userId;

    // Obtener el usuario actual para obtener su accountId
    const currentUser = await this.usersService.findOne(userId);

    if (!currentUser.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    // Verificar que el email no pertenezca a un usuario existente en la misma cuenta
    const existingUser = await this.userRepository.findOne({
      where: {
        email: inviteDto.email,
        account: { id: currentUser.accountId },
      },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists in this account');
    }

    return this.invitationsService.createInvitation(
      currentUser.accountId,
      inviteDto.email,
      inviteDto.roleId,
      userId,
    );
  }

  @Post('accept-invitation')
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto): Promise<User> {
    // Buscar la invitación
    const invitation = await this.invitationsService.findByToken(acceptDto.token);

    // Verificar que la invitación sea válida
    if (invitation.status !== 'pending') {
      throw new BadRequestException('This invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('This invitation has expired');
    }

    // Verificar si ya existe un usuario con este email
    const existingUser = await this.usersService.findByEmail(invitation.email);

    let savedUser: User;

    if (existingUser) {
      // CASO 1: Usuario existente - Solo agregar a la nueva cuenta
      // Verificar que el usuario no esté ya en esta cuenta
      if (existingUser.accountId === invitation.accountId) {
        throw new BadRequestException('User is already a member of this account');
      }

      // Verificar la contraseña del usuario existente
      const isPasswordValid = await PasswordUtil.comparePassword(
        acceptDto.password,
        existingUser.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }

      // Nota: En un sistema multi-tenant real, necesitarías una tabla de relación
      // users_accounts para soportar múltiples cuentas por usuario.
      // Por ahora, cambiamos el accountId del usuario (solo puede estar en una cuenta a la vez)
      const invitationAccount = await this.accountsService.findOne(invitation.accountId);
      if (!invitationAccount) {
        throw new NotFoundException('Invitation account not found');
      }

      existingUser.account = invitationAccount;
      savedUser = await this.userRepository.save(existingUser);
    } else {
      // CASO 2: Usuario nuevo - Crear cuenta nueva
      // Validar que firstName y lastName estén presentes para usuarios nuevos
      if (!acceptDto.firstName || !acceptDto.lastName) {
        throw new BadRequestException('firstName and lastName are required for new users');
      }

      const hashedPassword = await PasswordUtil.hashPassword(acceptDto.password);

      const invitationAccount = await this.accountsService.findOne(invitation.accountId);
      if (!invitationAccount) {
        throw new NotFoundException('Invitation account not found');
      }

      const newUser = this.userRepository.create({
        email: invitation.email,
        password: hashedPassword,
        firstName: acceptDto.firstName,
        lastName: acceptDto.lastName,
        account: invitationAccount,
        isAccountOwner: false,
      });

      savedUser = await this.userRepository.save(newUser);
    }

    // Marcar la invitación como aceptada
    await this.invitationsService.acceptInvitation(acceptDto.token, savedUser.id);

    // Retornar el usuario sin el password
    const { password: _password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }
}
