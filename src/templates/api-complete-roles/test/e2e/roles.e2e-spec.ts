import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { RoleType } from '../../src/modules/roles/entities/role.entity';

describe('Roles API (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let apiKey: string;
  let apiSecret: string;
  let createdRoleId: string;
  let createdPermissionId: string;

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

  describe('/roles (GET)', () => {
    it('should return all roles with permissions', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('permissions');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(401);
    });
  });

  describe('/roles/permissions/all (GET)', () => {
    it('should return all permissions', () => {
      return request(app.getHttpServer())
        .get('/roles/permissions/all')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('resource');
          expect(res.body[0]).toHaveProperty('action');
        });
    });
  });

  describe('/roles/permissions (POST)', () => {
    it('should create a new permission', async () => {
      const createPermissionDto = {
        name: 'test:create',
        description: 'Test permission for E2E',
        resource: 'test',
        action: 'create',
      };

      const response = await request(app.getHttpServer())
        .post('/roles/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createPermissionDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createPermissionDto.name);
      expect(response.body.resource).toBe(createPermissionDto.resource);
      expect(response.body.action).toBe(createPermissionDto.action);

      createdPermissionId = response.body.id;
    });

    it('should return 409 when creating duplicate permission', () => {
      const createPermissionDto = {
        name: 'users:read', // Already exists from seeder
        description: 'Duplicate permission',
        resource: 'users',
        action: 'read',
      };

      return request(app.getHttpServer())
        .post('/roles/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createPermissionDto)
        .expect(409);
    });

    it('should return 400 with invalid data', () => {
      const createPermissionDto = {
        name: '', // Invalid: empty name
        description: 'Invalid permission',
      };

      return request(app.getHttpServer())
        .post('/roles/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createPermissionDto)
        .expect(400);
    });
  });

  describe('/roles (POST)', () => {
    it('should create a new role without permissions', async () => {
      const createRoleDto = {
        name: RoleType.ADMIN,
        description: 'Test role for E2E',
      };

      // First, check if role exists and delete it
      const existingRoles = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      const existingRole = existingRoles.body.find(
        (r: any) => r.name === createRoleDto.name && r.description === createRoleDto.description,
      );

      if (existingRole) {
        await request(app.getHttpServer())
          .delete(`/roles/${existingRole.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-api-key', apiKey)
          .set('x-api-secret', apiSecret);
      }

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createRoleDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createRoleDto.name);
      expect(response.body.description).toBe(createRoleDto.description);

      createdRoleId = response.body.id;
    });

    it('should create a new role with permissions', async () => {
      // Get a permission ID first
      const permissionsResponse = await request(app.getHttpServer())
        .get('/roles/permissions/all')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      const permissionId = permissionsResponse.body[0].id;

      const createRoleDto = {
        name: RoleType.SUPERVISOR,
        description: 'Test supervisor role with permissions',
        permissionIds: [permissionId],
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(createRoleDto)
        .expect(201);

      expect(response.body).toHaveProperty('permissions');
      expect(response.body.permissions.length).toBeGreaterThan(0);

      // Clean up
      await request(app.getHttpServer())
        .delete(`/roles/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);
    });
  });

  describe('/roles/:id (GET)', () => {
    it('should return a role by id', async () => {
      const rolesResponse = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      const roleId = rolesResponse.body[0].id;

      return request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', roleId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('permissions');
        });
    });

    it('should return 404 for non-existent role', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      return request(app.getHttpServer())
        .get(`/roles/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(404);
    });
  });

  describe('/roles/:id (PATCH)', () => {
    it('should update a role', async () => {
      if (!createdRoleId) {
        // Create a role first if not exists
        const createResponse = await request(app.getHttpServer())
          .post('/roles')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-api-key', apiKey)
          .set('x-api-secret', apiSecret)
          .send({
            name: RoleType.OBSERVER,
            description: 'Original description',
          });

        createdRoleId = createResponse.body.id;
      }

      const updateRoleDto = {
        description: 'Updated description for E2E test',
      };

      return request(app.getHttpServer())
        .patch(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send(updateRoleDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe(updateRoleDto.description);
        });
    });
  });

  describe('/roles/:id/permissions (POST)', () => {
    it('should assign permissions to a role', async () => {
      if (!createdRoleId) {
        const createResponse = await request(app.getHttpServer())
          .post('/roles')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-api-key', apiKey)
          .set('x-api-secret', apiSecret)
          .send({
            name: RoleType.OBSERVER,
            description: 'Role for permission assignment test',
          });

        createdRoleId = createResponse.body.id;
      }

      // Get permission IDs
      const permissionsResponse = await request(app.getHttpServer())
        .get('/roles/permissions/all')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      const permissionIds = permissionsResponse.body.slice(0, 2).map((p: any) => p.id);

      return request(app.getHttpServer())
        .post(`/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({ permissionIds })
        .expect(200)
        .expect((res) => {
          expect(res.body.permissions.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/roles/:id/permissions (DELETE)', () => {
    it('should remove permissions from a role', async () => {
      if (!createdRoleId) {
        return;
      }

      // Get current permissions
      const roleResponse = await request(app.getHttpServer())
        .get(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret);

      if (roleResponse.body.permissions.length === 0) {
        return;
      }

      const permissionIds = [roleResponse.body.permissions[0].id];

      return request(app.getHttpServer())
        .delete(`/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .send({ permissionIds })
        .expect(200);
    });
  });

  describe('/roles/:id (DELETE)', () => {
    it('should delete a role', async () => {
      if (!createdRoleId) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(204);
    });
  });

  describe('/roles/permissions/:id (DELETE)', () => {
    it('should delete a permission', async () => {
      if (!createdPermissionId) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/roles/permissions/${createdPermissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', apiKey)
        .set('x-api-secret', apiSecret)
        .expect(204);
    });
  });
});
