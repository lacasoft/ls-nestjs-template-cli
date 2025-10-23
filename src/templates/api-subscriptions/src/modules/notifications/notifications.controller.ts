import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated notifications' })
  async getNotifications(@Request() req, @Query() query: GetNotificationsDto) {
    return this.notificationsService.getUserNotifications(req.user.userId, query);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async markAsRead(@Param('id') notificationId: string, @Request() req) {
    return this.notificationsService.markAsRead(notificationId, req.user.userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Returns notification preferences' })
  async getPreferences(@Request() req) {
    return this.notificationsService.getPreferences(req.user.userId);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(@Request() req, @Body() updateDto: UpdateNotificationPreferencesDto) {
    return this.notificationsService.updatePreferences(req.user.userId, updateDto);
  }
}
