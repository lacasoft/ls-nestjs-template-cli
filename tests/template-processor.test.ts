import { TemplateProcessor, TemplateVariables } from '../src/utils/template-processor';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('TemplateProcessor', () => {
  const testProjectPath = path.join(__dirname, 'test-template-project');
  const mockVariables: TemplateVariables = {
    projectName: 'My Test App',
    projectDescription: 'A test application',
    version: '2.0.0',
    author: 'John Doe',
    port: 4000,
    databaseUrl: 'postgresql://user:pass@localhost:5432/mydb',
    jwtSecret: 'secret123',
    apiKey: 'apikey123',
    apiSecret: 'apisecret123',
    databaseName: 'mydb',
    databaseUser: 'user',
    databasePassword: 'pass',
    databaseHost: 'localhost',
    databasePort: 5432,
    databaseType: 'postgres',
  };

  beforeEach(async () => {
    await fs.ensureDir(testProjectPath);
  });

  afterEach(async () => {
    await fs.remove(testProjectPath);
  });

  describe('processFiles', () => {
    it('should replace variables in text files', async () => {
      const testFile = path.join(testProjectPath, 'test.txt');
      await fs.writeFile(testFile, 'Project: {{projectName}}, Port: {{port}}');

      await TemplateProcessor.processFiles(testProjectPath, mockVariables);

      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('Project: My Test App, Port: 4000');
    });

    it('should replace projectNameKebab correctly', async () => {
      const testFile = path.join(testProjectPath, 'test.txt');
      await fs.writeFile(testFile, 'Name: {{projectNameKebab}}');

      await TemplateProcessor.processFiles(testProjectPath, mockVariables);

      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('Name: my-test-app');
    });

    it('should process package.json correctly', async () => {
      const packageJson = {
        name: '{{projectNameKebab}}',
        version: '{{version}}',
        description: '{{projectDescription}}',
        author: '{{author}}',
      };
      const packagePath = path.join(testProjectPath, 'package.json');
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));

      await TemplateProcessor.processFiles(testProjectPath, mockVariables);

      const content = await fs.readFile(packagePath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('my-test-app');
      expect(parsed.version).toBe('2.0.0');
      expect(parsed.description).toBe('A test application');
      expect(parsed.author).toBe('John Doe');
    });

    it('should skip node_modules directory', async () => {
      const nodeModulesPath = path.join(testProjectPath, 'node_modules');
      await fs.ensureDir(nodeModulesPath);
      const testFile = path.join(nodeModulesPath, 'test.txt');
      await fs.writeFile(testFile, '{{projectName}}');

      await TemplateProcessor.processFiles(testProjectPath, mockVariables);

      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('{{projectName}}'); // Should not be replaced
    });

    it('should replace all database variables', async () => {
      const testFile = path.join(testProjectPath, 'config.txt');
      await fs.writeFile(testFile,
        'DB: {{databaseType}}, Host: {{databaseHost}}, Port: {{databasePort}}, Name: {{databaseName}}'
      );

      await TemplateProcessor.processFiles(testProjectPath, mockVariables);

      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('DB: postgres, Host: localhost, Port: 5432, Name: mydb');
    });
  });
});
