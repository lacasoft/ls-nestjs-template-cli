import { EnvGenerator } from '../src/utils/env-generator';
import { TemplateVariables } from '../src/utils/template-processor';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('EnvGenerator', () => {
  describe('generateSecureSecret', () => {
    it('should generate a secret with default length of 32', () => {
      const secret = EnvGenerator.generateSecureSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate a secret with custom length', () => {
      const secret = EnvGenerator.generateSecureSecret(16);
      expect(secret).toBeDefined();
      expect(secret.length).toBe(32); // 16 bytes = 32 hex characters
    });

    it('should generate different secrets on each call', () => {
      const secret1 = EnvGenerator.generateSecureSecret();
      const secret2 = EnvGenerator.generateSecureSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateEnvFiles', () => {
    const testProjectPath = path.join(__dirname, 'test-project');
    const mockVariables: TemplateVariables = {
      projectName: 'Test Project',
      projectDescription: 'Test Description',
      version: '1.0.0',
      author: 'Test Author',
      port: 3000,
      databaseUrl: 'postgresql://postgres:password@localhost:5432/test_db',
      jwtSecret: 'test-jwt-secret',
      jwtExpiresIn: '1d',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtRefreshExpiresIn: '7d',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      databaseName: 'test_db',
      databaseUser: 'postgres',
      databasePassword: 'password',
      databaseHost: 'localhost',
      databasePort: 5432,
      databaseType: 'postgres',
      dbPoolSize: 10,
      dbIdleTimeout: 30000,
      dbConnectionTimeout: 10000,
      cacheTTL: 300,
      cacheMaxItems: 100,
      clusterWorkers: 'auto',
      throttleTTL: 60000,
      throttleLimit: 100,
      allowedOrigins: 'http://localhost:3000',
      adminEmail: 'admin@test.com',
      adminPassword: 'TestPass123!',
      adminFirstName: 'Admin',
      adminLastName: 'User',
    };

    beforeEach(async () => {
      await fs.ensureDir(testProjectPath);
    });

    afterEach(async () => {
      await fs.remove(testProjectPath);
    });

    it('should generate .env file', async () => {
      await EnvGenerator.generateEnvFiles(testProjectPath, mockVariables);
      const envPath = path.join(testProjectPath, '.env');
      const exists = await fs.pathExists(envPath);
      expect(exists).toBe(true);
    });

    it('should generate .env.example file', async () => {
      await EnvGenerator.generateEnvFiles(testProjectPath, mockVariables);
      const envExamplePath = path.join(testProjectPath, '.env.example');
      const exists = await fs.pathExists(envExamplePath);
      expect(exists).toBe(true);
    });

    it('should include correct database type in .env', async () => {
      await EnvGenerator.generateEnvFiles(testProjectPath, mockVariables);
      const envPath = path.join(testProjectPath, '.env');
      const content = await fs.readFile(envPath, 'utf8');
      expect(content).toContain('DB_TYPE=postgres');
    });

    it('should generate different content for SQLite', async () => {
      const sqliteVars = { ...mockVariables, databaseType: 'sqlite' };
      await EnvGenerator.generateEnvFiles(testProjectPath, sqliteVars);
      const envPath = path.join(testProjectPath, '.env');
      const content = await fs.readFile(envPath, 'utf8');
      expect(content).toContain('DB_TYPE=sqlite');
      expect(content).not.toContain('DB_HOST');
    });

    it('should generate different content for MySQL', async () => {
      const mysqlVars = { ...mockVariables, databaseType: 'mysql', databasePort: 3306 };
      await EnvGenerator.generateEnvFiles(testProjectPath, mysqlVars);
      const envPath = path.join(testProjectPath, '.env');
      const content = await fs.readFile(envPath, 'utf8');
      expect(content).toContain('DB_TYPE=mysql');
      expect(content).toContain('DB_PORT=3306');
    });
  });
});
