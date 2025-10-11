import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import { TemplateVariables } from './template-processor';

export class EnvGenerator {
  static generateSecureSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static async generateEnvFiles(projectPath: string, variables: TemplateVariables): Promise<void> {
    console.log(chalk.blue('🔐 Generando archivos de entorno...'));

    // .env
    const envContent = this.generateEnvContent(variables);
    await fs.writeFile(path.join(projectPath, '.env'), envContent);

    // .env.example
    const envExampleContent = this.generateEnvExampleContent(variables);
    await fs.writeFile(path.join(projectPath, '.env.example'), envExampleContent);
  }

  private static generateEnvContent(variables: TemplateVariables): string {
    const appContent = `# App
NODE_ENV=development
APP_NAME=${variables.projectName}
PORT=${variables.port}
API_KEY=${variables.apiKey}
API_SECRET=${variables.apiSecret}
JWT_SECRET=${variables.jwtSecret}
JWT_EXPIRES_IN=${variables.jwtExpiresIn}
`;

    // Configuración de base de datos según el tipo
    let databaseContent = '';
    if (variables.databaseType === 'sqlite') {
      databaseContent = `
# Database
# Supported types: postgres, mysql, mariadb, sqlite, mssql, oracle, cockroachdb, etc.
DB_TYPE=sqlite
DB_NAME=${variables.databaseName}
`;
    } else if (variables.databaseType === 'mysql') {
      databaseContent = `
# Database
# Supported types: postgres, mysql, mariadb, sqlite, mssql, oracle, cockroachdb, etc.
DB_TYPE=mysql
DB_HOST=${variables.databaseHost}
DB_PORT=${variables.databasePort}
DB_USERNAME=${variables.databaseUser}
DB_PASSWORD=${variables.databasePassword}
DB_NAME=${variables.databaseName}
DB_SSL=false
`;
    } else {
      // PostgreSQL por defecto
      databaseContent = `
# Database
# Supported types: postgres, mysql, mariadb, sqlite, mssql, oracle, cockroachdb, etc.
DB_TYPE=postgres
DB_HOST=${variables.databaseHost}
DB_PORT=${variables.databasePort}
DB_USERNAME=${variables.databaseUser}
DB_PASSWORD=${variables.databasePassword}
DB_NAME=${variables.databaseName}
DB_SSL=false
`;
    }

    const securityContent = `
# Seguridad
ALLOWED_ORIGINS=${variables.allowedOrigins}
JWT_REFRESH_SECRET=${variables.jwtRefreshSecret}
JWT_REFRESH_EXPIRES_IN=${variables.jwtRefreshExpiresIn}
`;

    const performanceContent = `
# Performance
CACHE_TTL=${variables.cacheTTL}
CACHE_MAX_ITEMS=${variables.cacheMaxItems}
CLUSTER_WORKERS=${variables.clusterWorkers}
`;

    const dbPoolContent = `
# Database Pool
DB_POOL_SIZE=${variables.dbPoolSize}
DB_IDLE_TIMEOUT=${variables.dbIdleTimeout}
DB_CONNECTION_TIMEOUT=${variables.dbConnectionTimeout}
`;

    const rateLimitContent = `
# Rate Limiting
THROTTLE_TTL=${variables.throttleTTL}
THROTTLE_LIMIT=${variables.throttleLimit}
`;

    const adminContent = `
# Admin User (Para seeder inicial)
ADMIN_EMAIL=${variables.adminEmail}
ADMIN_PASSWORD=${variables.adminPassword}
ADMIN_FIRST_NAME=${variables.adminFirstName}
ADMIN_LAST_NAME=${variables.adminLastName}
`;

    const swaggerContent = `
# Swagger
SWAGGER_TITLE=${variables.projectName} API
SWAGGER_DESCRIPTION=${variables.projectDescription}
SWAGGER_VERSION=${variables.version}
`;

    return (
      appContent +
      databaseContent +
      securityContent +
      performanceContent +
      dbPoolContent +
      rateLimitContent +
      adminContent +
      swaggerContent
    );
  }

  private static generateEnvExampleContent(_variables: TemplateVariables): string {
    return `# App
NODE_ENV=development
APP_NAME=your-app-name
PORT=3000
API_KEY=your-api-key-here
API_SECRET=your-api-secret-here
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=1d

# Database
# Supported types: postgres, mysql, mariadb, sqlite, mssql, oracle, cockroachdb, etc.
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password-here
DB_NAME=your_database_name
DB_SSL=false

# Seguridad
ALLOWED_ORIGINS=http://localhost:3000,https://tudominio.com
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Performance
CACHE_TTL=300
CACHE_MAX_ITEMS=100
CLUSTER_WORKERS=auto

# Database Pool
DB_POOL_SIZE=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Admin User (Para seeder inicial)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Swagger
SWAGGER_TITLE=Your API Title
SWAGGER_DESCRIPTION=Your API Description
SWAGGER_VERSION=1.0.0
`;
  }
}
