import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Auth API (e2e)', () => {
  let app: INestApplication<App>;
  let apiKey: string;
  let apiSecret: string;
  let accessToken: string;
  let refreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || '1a930fea4860e779a3d8abc31ec2556d';

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', adminEmail);
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user).toHaveProperty('permissions');

      // Store tokens for subsequent tests
      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    it('should include roles and permissions in login response', async () => {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || '1a930fea4860e779a3d8abc31ec2556d';

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      expect(response.body.user.roles).toBeInstanceOf(Array);
      expect(response.body.user.permissions).toBeInstanceOf(Array);
      expect(response.body.user.roles.length).toBeGreaterThan(0);
      expect(response.body.user.permissions.length).toBeGreaterThan(0);
    });

    it('should return 401 with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 with incorrect password', async () => {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

      return request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: adminEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 400 with missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 with missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 401 without API credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      // First login to get tokens
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || '1a930fea4860e779a3d8abc31ec2556d';

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: adminEmail,
          password: adminPassword,
        });

      const oldRefreshToken = loginResponse.body.refresh_token;

      // Now refresh the tokens
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .set('Authorization', `Bearer ${oldRefreshToken}`)
        .send({
          refresh_token: oldRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.access_token).toBeTruthy();
      expect(response.body.refresh_token).toBeTruthy();
    });

    it('should return 401 with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .set('Authorization', 'Bearer invalid-token')
        .send({
          refresh_token: 'invalid-token',
        })
        .expect(401);
    });

    it('should return 401 without refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({})
        .expect(401);
    });

    it('should return 401 without Authorization header', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          refresh_token: 'some-token',
        })
        .expect(401);
    });
  });

  describe('Authentication flow', () => {
    it('should complete full authentication flow', async () => {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || '1a930fea4860e779a3d8abc31ec2556d';

      // Step 1: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      const { access_token, refresh_token } = loginResponse.body;

      // Step 2: Access protected resource with access token
      await request(app.getHttpServer())
        .get('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      // Step 3: Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .set('Authorization', `Bearer ${refresh_token}`)
        .send({
          refresh_token,
        })
        .expect(200);

      const { access_token: new_access_token } = refreshResponse.body;

      // Step 4: Access protected resource with new access token
      await request(app.getHttpServer())
        .get('/users')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .set('Authorization', `Bearer ${new_access_token}`)
        .expect(200);
    });
  });
});
