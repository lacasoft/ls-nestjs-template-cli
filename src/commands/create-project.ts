import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { TemplateManager } from '../generators/template-manager';
import { TemplateProcessor, TemplateVariables } from '../utils/template-processor';
import { EnvGenerator } from '../utils/env-generator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProject(this: any, projectName?: string, _options?: any) {
  const templateManager = new TemplateManager();

  console.log(chalk.green('🚀 NestJS Template CLI - Create Project\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Nombre del proyecto:',
      default: projectName || 'my-nestjs-app',
      validate: (input: string) => {
        if (/^([A-Za-z\-_\d])+$/.test(input)) return true;
        return 'Nombre inválido. Use solo letras, números, guiones y guiones bajos.';
      },
    },
    {
      type: 'list',
      name: 'templateId',
      message: 'Selecciona el template base:',
      choices: () => {
        const templates = templateManager.getAvailableTemplates();
        return templates.map((template) => ({
          name: `${template.config.name} - ${template.config.description}`,
          value: template.id,
        }));
      },
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Descripción del proyecto:',
      default: 'A NestJS project',
    },
    {
      type: 'input',
      name: 'version',
      message: 'Versión:',
      default: '1.0.0',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Autor:',
      default: 'developer',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Puerto de la aplicación:',
      default: 3000,
    },
    {
      type: 'confirm',
      name: 'database',
      message: '¿Incluir base de datos?',
      default: true,
    },
    {
      type: 'list',
      name: 'databaseType',
      message: 'Tipo de base de datos:',
      choices: [
        { name: 'PostgreSQL', value: 'postgres' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'SQLite', value: 'sqlite' },
      ],
      when: (answers) => answers.database,
    },
    {
      type: 'input',
      name: 'databaseName',
      message: 'Nombre de la base de datos:',
      default: (answers: { projectName: string }) =>
        `${answers.projectName.toLowerCase().replace(/\s+/g, '_')}_dev`,
      when: (answers) => answers.database,
    },
  ]);

  // Generar variables dinámicas según el tipo de base de datos
  const dbConfig = getDatabaseConfig(answers.databaseType);

  const templateVariables: TemplateVariables = {
    // Project Info
    projectName: answers.projectName,
    projectDescription: answers.projectDescription,
    version: answers.version,
    author: answers.author,
    port: answers.port,

    // Security
    jwtSecret: EnvGenerator.generateSecureSecret(),
    jwtExpiresIn: '1d',
    jwtRefreshSecret: EnvGenerator.generateSecureSecret(),
    jwtRefreshExpiresIn: '7d',
    apiKey: EnvGenerator.generateSecureSecret(16),
    apiSecret: EnvGenerator.generateSecureSecret(24),

    // Database
    databaseType: answers.databaseType || 'postgres',
    databaseUrl: generateDatabaseUrl(answers),
    databaseName: answers.databaseName || '',
    databaseUser: dbConfig.user,
    databasePassword: dbConfig.password,
    databaseHost: dbConfig.host,
    databasePort: dbConfig.port,

    // Database Pool
    dbPoolSize: 10,
    dbIdleTimeout: 30000,
    dbConnectionTimeout: 10000,

    // Performance
    cacheTTL: 300,
    cacheMaxItems: 100,
    clusterWorkers: 'auto',

    // Rate Limiting
    throttleTTL: 60000,
    throttleLimit: 100,

    // CORS
    allowedOrigins: `http://localhost:${answers.port}`,

    // Admin User
    adminEmail: 'admin@example.com',
    adminPassword: EnvGenerator.generateSecureSecret(16),
    adminFirstName: 'Admin',
    adminLastName: 'User',
  };

  await generateProject(
    answers.projectName,
    answers.templateId,
    templateVariables,
    templateManager,
  );
}

async function generateProject(
  projectName: string,
  templateId: string,
  variables: TemplateVariables,
  templateManager: TemplateManager,
) {
  const projectPath = path.resolve(process.cwd(), projectName);

  // Verificar si existe
  if (fs.existsSync(projectPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `El directorio ${projectName} ya existe. ¿Sobrescribir?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('❌ Operación cancelada.'));
      return;
    }
    fs.removeSync(projectPath);
  }

  console.log(chalk.blue(`📁 Creando proyecto: ${projectName}`));
  console.log(chalk.blue(`📋 Usando template: ${templateId}`));

  // Crear directorio
  fs.ensureDirSync(projectPath);

  // Verificar que el template existe
  if (!templateManager.templateExists(templateId)) {
    console.log(chalk.red(`❌ Template "${templateId}" no encontrado.`));
    console.log(chalk.white('   Usa "nestjs-template list" para ver templates disponibles.'));
    return;
  }

  // Copiar template
  const templatePath = templateManager.getTemplatePath(templateId);
  const globalPath = templateManager.getGlobalConfigPath();

  try {
    await fs.copy(templatePath, projectPath);
    console.log(chalk.green('✅ Template copiado correctamente'));

    // Copiar archivos globales si no existen en el template
    await copyGlobalFiles(globalPath, projectPath);
    console.log(chalk.green('✅ Configuraciones globales aplicadas'));

    // Procesar templates
    await TemplateProcessor.processFiles(projectPath, variables);
    console.log(chalk.green('✅ Variables procesadas correctamente'));

    // Generar archivos de entorno
    await EnvGenerator.generateEnvFiles(projectPath, variables);
    console.log(chalk.green('✅ Archivos de entorno generados correctamente'));
  } catch (error) {
    console.log(chalk.red('❌ Error generando proyecto:'), error);
    return;
  }

  console.log(chalk.green(`\n🎉 Proyecto ${projectName} creado exitosamente!`));
  displayNextSteps(projectName, variables);
}

function displayNextSteps(projectName: string, variables: TemplateVariables) {
  console.log(chalk.cyan('\n📋 Próximos pasos:'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white('  npm install'));
  console.log(chalk.white('  npm run start:dev'));
  console.log(chalk.blue(`\n📍 La aplicación estará en: http://localhost:${variables.port}`));
}

// Helper function to copy global configuration files
async function copyGlobalFiles(globalPath: string, projectPath: string): Promise<void> {
  const globalFiles = ['.gitignore', 'Dockerfile', '.dockerignore'];

  for (const file of globalFiles) {
    const globalFilePath = path.join(globalPath, file);
    const projectFilePath = path.join(projectPath, file);

    // Solo copiar si el archivo global existe y NO existe en el proyecto
    if ((await fs.pathExists(globalFilePath)) && !(await fs.pathExists(projectFilePath))) {
      await fs.copy(globalFilePath, projectFilePath);
    }
  }
}

// Helper function to get database configuration
function getDatabaseConfig(databaseType: string): {
  user: string;
  password: string;
  host: string;
  port: number;
} {
  switch (databaseType) {
    case 'postgres':
      return {
        user: 'postgres',
        password: 'password',
        host: 'localhost',
        port: 5432,
      };
    case 'mysql':
      return {
        user: 'root',
        password: 'password',
        host: 'localhost',
        port: 3306,
      };
    case 'sqlite':
      return {
        user: '',
        password: '',
        host: '',
        port: 0,
      };
    default:
      return {
        user: 'user',
        password: 'password',
        host: 'localhost',
        port: 5432,
      };
  }
}

// Helper function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateDatabaseUrl(details: any): string {
  if (!details.database) return '';

  const dbName =
    details.databaseName || `${details.projectName.toLowerCase().replace(/\s+/g, '_')}_dev`;
  const dbType = details.databaseType;

  switch (dbType) {
    case 'postgres':
      return `postgresql://postgres:password@localhost:5432/${dbName}`;
    case 'mysql':
      return `mysql://root:password@localhost:3306/${dbName}`;
    case 'sqlite':
      return `sqlite:./${dbName}.db`;
    default:
      return `${dbType}://localhost/${dbName}`;
  }
}
