import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { NotificationChannel } from '../entities/notification.entity';

export class UpdateNotificationPreferencesDto {
  // Payment notifications
  @ApiPropertyOptional({ description: 'Enable payment success notifications' })
  @IsOptional()
  @IsBoolean()
  paymentSuccess?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for payment success notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  paymentSuccessChannels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Enable payment failed notifications' })
  @IsOptional()
  @IsBoolean()
  paymentFailed?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for payment failed notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  paymentFailedChannels?: NotificationChannel[];

  // Subscription notifications
  @ApiPropertyOptional({ description: 'Enable subscription expiring notifications' })
  @IsOptional()
  @IsBoolean()
  subscriptionExpiring?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for subscription expiring notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  subscriptionExpiringChannels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Enable subscription expired notifications' })
  @IsOptional()
  @IsBoolean()
  subscriptionExpired?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for subscription expired notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  subscriptionExpiredChannels?: NotificationChannel[];

  // Trial notifications
  @ApiPropertyOptional({ description: 'Enable trial expiring notifications' })
  @IsOptional()
  @IsBoolean()
  trialExpiring?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for trial expiring notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  trialExpiringChannels?: NotificationChannel[];

  // Bank transfer notifications
  @ApiPropertyOptional({ description: 'Enable bank transfer status notifications' })
  @IsOptional()
  @IsBoolean()
  bankTransferStatus?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for bank transfer status notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  bankTransferStatusChannels?: NotificationChannel[];

  // Invitation notifications
  @ApiPropertyOptional({ description: 'Enable invitation notifications' })
  @IsOptional()
  @IsBoolean()
  invitations?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for invitation notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  invitationsChannels?: NotificationChannel[];

  // System announcements
  @ApiPropertyOptional({ description: 'Enable system announcement notifications' })
  @IsOptional()
  @IsBoolean()
  systemAnnouncements?: boolean;

  @ApiPropertyOptional({
    description: 'Channels for system announcement notifications',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  systemAnnouncementsChannels?: NotificationChannel[];
}
