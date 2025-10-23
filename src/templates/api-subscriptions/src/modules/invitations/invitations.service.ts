import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InvitationTokenRepository } from './repositories/invitation-token.repository';
import { InvitationToken, InvitationStatus } from './entities/invitation-token.entity';
import { EmailService } from '../../common/services/email.service';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitationTokenRepository: InvitationTokenRepository,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
  ) {}

  async createInvitation(
    accountId: string,
    email: string,
    roleId: string,
    invitedByUserId: string,
  ): Promise<InvitationToken> {
    // Verificar si ya existe una invitación pendiente para este email en esta cuenta
    const existingInvitation = await this.invitationTokenRepository.findPendingByEmail(
      email,
      accountId,
    );

    if (existingInvitation) {
      throw new ConflictException('There is already a pending invitation for this email');
    }

    // Obtener información del usuario que invita y la cuenta
    const invitedByUser = await this.usersService.findOne(invitedByUserId);
    const account = await this.accountsService.findOne(accountId);

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');

    // La invitación expira en 7 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationTokenRepository.create({
      accountId,
      email,
      token,
      roleId,
      invitedByUserId,
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    const savedInvitation = await this.invitationTokenRepository.save(invitation);

    // Enviar correo de invitación
    try {
      const invitedByName = `${invitedByUser.firstName} ${invitedByUser.lastName}`;
      await this.emailService.sendInvitationEmail(email, invitedByName, account.name, token);
      this.logger.log(`Invitation email sent to ${email} for account ${account.name}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
      // No lanzamos error para que la invitación se cree aunque falle el correo
      // El usuario puede reenviar la invitación si es necesario
    }

    return savedInvitation;
  }

  async findByToken(token: string): Promise<InvitationToken> {
    const invitation = await this.invitationTokenRepository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  async findPendingByAccountId(accountId: string): Promise<InvitationToken[]> {
    return this.invitationTokenRepository.findPendingByAccountId(accountId);
  }

  async acceptInvitation(token: string, userId: string): Promise<InvitationToken> {
    const invitation = await this.findByToken(token);

    // Verificar que la invitación esté pendiente
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }

    // Verificar que no haya expirado
    if (new Date() > invitation.expiresAt) {
      await this.invitationTokenRepository.markAsExpired(invitation.id);
      throw new BadRequestException('This invitation has expired');
    }

    // Marcar como aceptada
    await this.invitationTokenRepository.markAsAccepted(invitation.id, userId);

    return this.findByToken(token);
  }

  async revokeInvitation(id: string, accountId: string): Promise<void> {
    const invitation = await this.invitationTokenRepository.findOne({
      where: { id, account: { id: accountId } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    await this.invitationTokenRepository.markAsRevoked(id);
  }

  async expireOldInvitations(): Promise<void> {
    const expiredInvitations = await this.invitationTokenRepository.findExpiredInvitations();

    for (const invitation of expiredInvitations) {
      await this.invitationTokenRepository.markAsExpired(invitation.id);
    }
  }
}
