import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeaturesService } from './features.service';
import { CheckFeatureDto } from './dto/check-feature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Post('check')
  @ApiOperation({
    summary: 'Check if a feature is available',
    description:
      "Verify if a specific feature is available in the user's current subscription plan",
  })
  @ApiResponse({
    status: 200,
    description: 'Feature availability checked',
    schema: {
      example: {
        available: true,
        planName: 'Professional',
      },
    },
  })
  async checkFeature(@Request() req, @Body() checkFeatureDto: CheckFeatureDto) {
    return this.featuresService.checkFeature(req.user.userId, checkFeatureDto.featureCode);
  }

  @Get('usage')
  @ApiOperation({
    summary: 'Get account usage statistics',
    description: 'Returns current usage stats including users, locations, and plan limits',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved',
    schema: {
      example: {
        plan: {
          name: 'Professional',
          status: 'active',
          features: ['advanced_analytics', 'multi_location', 'api_access'],
        },
        usage: {
          users: {
            current: 5,
            limit: 10,
            unlimited: false,
          },
          locations: {
            current: 2,
            limit: 5,
            unlimited: false,
          },
        },
        subscription: {
          status: 'active',
          currentPeriodEnd: '2025-02-13T00:00:00.000Z',
          trialEndsAt: null,
          autoRenew: true,
        },
      },
    },
  })
  async getUsage(@Request() req) {
    return this.featuresService.getUsage(req.user.userId);
  }
}
