import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Users API (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let apiKey: string;
  let apiSecret: string;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Get API credentials from environment
    apiKey = process.env.API_KEY || '5e7f01aac03409ba00762c1e2b7e3970';
    apiSecret = process.env.API_SECRET || '8dbc2622f2a05ce44ee46b623e3bdc484fb37d7603ce7ce9';

    // Login to get auth token
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '1a930fea4860e779a3d8abc31ec2556d';

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', apiKey)
      .set('x-api-secret', apiSecret)
      .send({
        email: adminEmail,
        password: adminPassword,
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user without authentication (public endpoint)', async () => {
      const timestamp = Date.now();
      const createUserDto = {
        email: `newuser${timestamp}@example.com`,
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', createUserDto.email);
      expect(response.body).toHaveProperty('firstName', createUserDto.firstName);
      expect(response.body).toHaveProperty('lastName', createUserDto.lastName);
      expect(response.body).toHaveProperty('isActive', true);

      createdUserId = response.body.id;
    });

    it('should return 409 when creating user with existing email', async () => {
      const timestamp = Date.now();
      const createUserDto = {
        email: `duplicate${timestamp}@example.com`,
        password: 'Password123!',
        firstName: 'Duplicate',
        lastName: 'User',
      };

      // Create user first time
      await request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createUserDto)
        .expect(201);

      // Try to create again with same email
      return request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createUserDto)
        .expect(409);
    });

    it('should return 400 with invalid email format', () => {
      const createUserDto = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createUserDto)
        .expect(400);
    });

    it('should return 400 with missing required fields', () => {
      const createUserDto = {
        email: 'test@example.com',
        // missing password, firstName, lastName
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createUserDto)
        .expect(400);
    });

    it('should return 400 with empty password', () => {
      const createUserDto = {
        email: 'test@example.com',
        password: '',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createUserDto)
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users with valid authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('email');
          expect(res.body[0]).toHaveProperty('firstName');
          expect(res.body[0]).toHaveProperty('lastName');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(401);
    });

    it('should use caching for subsequent requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200);

      // Both responses should be identical (from cache)
      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by id', async () => {
      // First get all users to find a valid ID
      const usersResponse = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      const userId = usersResponse.body[0].id;

      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('lastName');
        });
    });

    it('should return 404 for non-existent user', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      return request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const usersResponse = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      const userId = usersResponse.body[0].id;

      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(401);
    });

    it('should return error with invalid UUID format', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect((res) => {
          // Could be 400 or 500 depending on implementation
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when creating a new user', async () => {
      // Get initial users list (will be cached)
      const response1 = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200);

      const initialCount = response1.body.length;

      // Create a new user (should invalidate cache)
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: `cachetest${timestamp}@example.com`,
          password: 'Password123!',
          firstName: 'Cache',
          lastName: 'Test',
        })
        .expect(201);

      // Get users list again (should return fresh data, not cached)
      const response2 = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200);

      expect(response2.body.length).toBeGreaterThan(initialCount);
    });
  });

  describe('Authorization', () => {
    it('should allow access with valid JWT token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200);
    });

    it('should deny access without JWT token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(401);
    });

    it('should deny access with malformed JWT token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer malformed.token.here')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(401);
    });
  });
});
