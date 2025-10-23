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
  NotFoundException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully', type: Location })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or plan limit reached',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only tenant accounts can create locations',
  })
  async create(@Body() createLocationDto: CreateLocationDto, @Request() req): Promise<Location> {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.locationsService.create(createLocationDto, user.accountId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations for the current user account' })
  @ApiResponse({ status: 200, description: 'List of locations', type: [Location] })
  async findAll(@Request() req): Promise<Location[]> {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.locationsService.findAll(user.accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific location by ID' })
  @ApiResponse({ status: 200, description: 'Location found', type: Location })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Location> {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.locationsService.findOne(id, user.accountId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully', type: Location })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @Request() req,
  ): Promise<Location> {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    return this.locationsService.update(id, updateLocationDto, user.accountId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a location' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user.accountId) {
      throw new NotFoundException('User has no account assigned');
    }

    await this.locationsService.remove(id, user.accountId);

    return { message: 'Location deleted successfully' };
  }
}
