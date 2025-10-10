"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvGenerator = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const chalk_1 = __importDefault(require("chalk"));
class EnvGenerator {
    static generateSecureSecret(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    static async generateEnvFiles(projectPath, variables) {
        console.log(chalk_1.default.blue('🔐 Generando archivos de entorno...'));
        // .env
        const envContent = this.generateEnvContent(variables);
        await fs_extra_1.default.writeFile(path_1.default.join(projectPath, '.env'), envContent);
        // .env.example
        const envExampleContent = this.generateEnvExampleContent(variables);
        await fs_extra_1.default.writeFile(path_1.default.join(projectPath, '.env.example'), envExampleContent);
    }
    static generateEnvContent(variables) {
        const baseContent = `# Application
NODE_ENV=development
PORT=${variables.port}
APP_NAME=${variables.projectName}

# Security
JWT_SECRET=${variables.jwtSecret}
JWT_EXPIRES_IN=1d
API_KEY=${variables.apiKey}
API_SECRET=${variables.apiSecret}
`;
        // Configuración específica según el tipo de base de datos
        let databaseContent = '';
        if (variables.databaseType === 'sqlite') {
            databaseContent = `
# Database (SQLite)
DB_TYPE=sqlite
DB_NAME=${variables.databaseName}
DB_URL=${variables.databaseUrl}
`;
        }
        else if (variables.databaseType === 'mysql') {
            databaseContent = `
# Database (MySQL)
DB_TYPE=mysql
DB_HOST=${variables.databaseHost}
DB_PORT=${variables.databasePort}
DB_USERNAME=${variables.databaseUser}
DB_PASSWORD=${variables.databasePassword}
DB_NAME=${variables.databaseName}
DB_URL=${variables.databaseUrl}
`;
        }
        else {
            // PostgreSQL por defecto
            databaseContent = `
# Database (PostgreSQL)
DB_TYPE=postgres
DB_HOST=${variables.databaseHost}
DB_PORT=${variables.databasePort}
DB_USERNAME=${variables.databaseUser}
DB_PASSWORD=${variables.databasePassword}
DB_NAME=${variables.databaseName}
DB_URL=${variables.databaseUrl}
`;
        }
        const swaggerContent = `
# Swagger
SWAGGER_TITLE=${variables.projectName} API
SWAGGER_DESCRIPTION=${variables.projectDescription}
SWAGGER_VERSION=${variables.version}
`;
        return baseContent + databaseContent + swaggerContent;
    }
    static generateEnvExampleContent(variables) {
        return `# Application
NODE_ENV=development
PORT=3000
APP_NAME=your-app-name

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1d
API_KEY=your-api-key-here
API_SECRET=your-api-secret-here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_URL=postgresql://user:pass@localhost:5432/db_name

# Swagger
SWAGGER_TITLE=Your API Title
SWAGGER_DESCRIPTION=Your API Description
SWAGGER_VERSION=1.0.0
`;
    }
}
exports.EnvGenerator = EnvGenerator;
