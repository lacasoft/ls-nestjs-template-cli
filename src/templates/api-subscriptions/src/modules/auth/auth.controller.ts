import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EnableMfaDto } from './dto/enable-mfa.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { VerifyMfaLoginDto } from './dto/verify-mfa-login.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RefreshJwtAuthGuard } from '../../common/guards/refresh-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MfaService } from './mfa.service';
import { UsersService } from '../users/users.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mfaService: MfaService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('mfa/verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA token during login' })
  @ApiResponse({
    status: 200,
    description: 'MFA verification successful, returns access tokens',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '550c3a7c-ac5f-4a34-a3ca-d5a10c3f7a29',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          roles: [],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired temp token' })
  @ApiResponse({ status: 401, description: 'Invalid MFA token' })
  async verifyMfaLogin(@Body() verifyMfaLoginDto: VerifyMfaLoginDto) {
    return this.authService.verifyMfaLogin(verifyMfaLoginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.authService.logout(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const email = req.user.email;
    return this.authService.refreshTokens(userId, email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if account exists',
    schema: {
      example: {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable multi-factor authentication' })
  @ApiResponse({
    status: 200,
    description: 'MFA secret and QR code generated',
    schema: {
      example: {
        success: true,
        message: 'MFA setup initiated. Scan the QR code with your authenticator app.',
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'MFA already enabled or invalid password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enableMfa(@Request() req: AuthenticatedRequest, @Body() enableMfaDto: EnableMfaDto) {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    // Always verify password before enabling/regenerating MFA (security best practice)
    const isPasswordValid = await this.authService.validatePassword(
      enableMfaDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid password',
      };
    }

    // Generate new secret
    const secret = this.mfaService.generateSecret();
    const qrCode = await this.mfaService.generateQRCode(user.email, secret);

    // Store secret temporarily (not yet enabled)
    await this.usersService.update(userId, {
      mfaSecret: secret,
      mfaEnabled: false, // Will be enabled after verification
    });

    return {
      success: true,
      message:
        'MFA setup initiated. Scan the QR code with your authenticator app and verify with a token.',
      secret,
      qrCode,
    };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA token and complete setup' })
  @ApiResponse({
    status: 200,
    description: 'MFA verified and enabled',
    schema: {
      example: {
        success: true,
        message: 'MFA has been successfully enabled for your account.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid token or MFA not initialized' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyMfa(@Request() req: AuthenticatedRequest, @Body() verifyMfaDto: VerifyMfaDto) {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user.mfaSecret) {
      return {
        success: false,
        message: 'MFA not initialized. Please call /auth/mfa/enable first.',
      };
    }

    // Verify the token
    const isValid = this.mfaService.verifyToken(verifyMfaDto.token, user.mfaSecret);

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid MFA token. Please try again.',
      };
    }

    // Enable MFA for the user
    await this.usersService.update(userId, {
      mfaEnabled: true,
    });

    return {
      success: true,
      message: 'MFA has been successfully enabled for your account.',
    };
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable multi-factor authentication' })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled successfully',
    schema: {
      example: {
        success: true,
        message: 'MFA has been successfully disabled for your account.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid password or MFA token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async disableMfa(@Request() req: AuthenticatedRequest, @Body() disableMfaDto: DisableMfaDto) {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    // Verify user has MFA enabled
    if (!user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for your account.',
      };
    }

    // Verify password
    const isPasswordValid = await this.authService.validatePassword(
      disableMfaDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid password.',
      };
    }

    // Verify MFA token
    const isMfaTokenValid = this.mfaService.verifyToken(disableMfaDto.token, user.mfaSecret);

    if (!isMfaTokenValid) {
      return {
        success: false,
        message: 'Invalid MFA token.',
      };
    }

    // Disable MFA
    await this.usersService.update(userId, {
      mfaEnabled: false,
      mfaSecret: undefined,
    });

    return {
      success: true,
      message: 'MFA has been successfully disabled for your account.',
    };
  }
}
