/**
 * Cache key constants for Users module
 * Using module prefix to avoid key collisions
 */
export const UsersCacheKeys = {
  PREFIX: 'users',
  ALL: 'users:all',
  ONE: (id: string) => `users:${id}`,
  BY_EMAIL: (email: string) => `users:email:${email}`,
  ACTIVE: 'users:active',
  PREFERENCES: (userId: string) => `users:${userId}:preferences`,
  PERMISSIONS: (userId: string) => `users:${userId}:permissions`,
} as const;
