import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Configuration')
@Controller('config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Get public system configuration',
    description:
      'Returns system configuration parameters that are marked as public. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public configuration retrieved successfully',
    schema: {
      example: {
        defaultCurrency: 'USD',
        trialDaysDefault: 14,
        companyName: 'LACA-SOFT',
        supportEmail: 'support@lacasoft.com',
        billingEmail: 'billing@lacasoft.com',
        passwordMinLength: 8,
        invoiceNumberPrefix: 'INV',
        features: {
          emailNotifications: true,
          smsNotifications: true,
        },
      },
    },
  })
  async getPublicConfig() {
    return this.systemConfigService.getPublicConfig();
  }
}
