import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Interface representing the user data available from JWT token
 *
 * NOTE: Permissions are NOT included in JWT tokens.
 * Use GET /users/me/permissions endpoint to fetch user permissions.
 */
export interface CurrentUserData {
  userId: string;
  email: string;
  roles: string[];
  // permissions: NOT in JWT - use /users/me/permissions endpoint
}

/**
 * Custom decorator to extract the current authenticated user from the request
 *
 * This decorator retrieves the user object that was attached to the request
 * by the JWT authentication guard after successful token validation.
 *
 * @param data - Optional property name to extract from the user object
 * @param ctx - Execution context
 * @returns The complete user object or a specific property if specified
 *
 * @example
 * ```typescript
 * // Get the complete user object
 * @Get('profile')
 * getProfile(@CurrentUser() user: CurrentUserData) {
 *   return user;
 * }
 *
 * // Get only the user ID
 * @Get('my-data')
 * getMyData(@CurrentUser('userId') userId: string) {
 *   return this.service.findByUserId(userId);
 * }
 *
 * // Get only the email
 * @Post('send-notification')
 * sendNotification(@CurrentUser('email') email: string) {
 *   return this.notificationService.send(email);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Map the JWT payload to our CurrentUserData interface
    const currentUser: CurrentUserData = {
      userId: user.userId || user.sub || user.id,
      email: user.email,
      roles: user.roles || [],
      // permissions: NOT included - use /users/me/permissions endpoint
    };

    return data ? currentUser[data] : currentUser;
  },
);
