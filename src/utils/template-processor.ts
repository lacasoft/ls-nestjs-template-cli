import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export interface TemplateVariables {
  // Project Info
  projectName: string;
  projectDescription: string;
  version: string;
  author: string;
  port: number;

  // Security
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  apiKey: string;
  apiSecret: string;

  // Database
  databaseType: string;
  databaseUrl: string;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
  databaseHost: string;
  databasePort: number;

  // Database Pool
  dbPoolSize: number;
  dbIdleTimeout: number;
  dbConnectionTimeout: number;

  // Performance
  cacheTTL: number;
  cacheMaxItems: number;
  clusterWorkers: string;

  // Rate Limiting
  throttleTTL: number;
  throttleLimit: number;

  // CORS
  allowedOrigins: string;

  // Admin User
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export class TemplateProcessor {
  static async processFiles(projectPath: string, variables: TemplateVariables): Promise<void> {
    console.log(chalk.blue('🔧 Procesando plantillas...'));

    const files = await this.getAllFiles(projectPath);

    for (const file of files) {
      await this.processFile(file, variables);
    }
  }

  private static async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDirectory(currentPath: string) {
      const items = await fs.readdir(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist'].includes(item)) {
            await scanDirectory(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }

    await scanDirectory.call(this, dir);
    return files;
  }

  private static async processFile(filePath: string, variables: TemplateVariables): Promise<void> {
    try {
      let content = await fs.readFile(filePath, 'utf8');

      // Reemplazar variables
      content = this.replaceVariables(content, variables);

      // Procesar package.json específicamente
      if (path.basename(filePath) === 'package.json') {
        content = this.processPackageJson(content, variables);
      }

      await fs.writeFile(filePath, content, 'utf8');
    } catch {
      // Ignorar archivos binarios
    }
  }

  private static replaceVariables(content: string, variables: TemplateVariables): string {
    const variableMap = {
      // Project
      '{{projectName}}': variables.projectName,
      '{{projectNameKebab}}': variables.projectName.toLowerCase().replace(/\s+/g, '-'),
      '{{projectDescription}}': variables.projectDescription,
      '{{version}}': variables.version,
      '{{author}}': variables.author,
      '{{port}}': variables.port.toString(),

      // Security
      '{{jwtSecret}}': variables.jwtSecret,
      '{{jwtExpiresIn}}': variables.jwtExpiresIn,
      '{{jwtRefreshSecret}}': variables.jwtRefreshSecret,
      '{{jwtRefreshExpiresIn}}': variables.jwtRefreshExpiresIn,
      '{{apiKey}}': variables.apiKey,
      '{{apiSecret}}': variables.apiSecret,

      // Database
      '{{databaseType}}': variables.databaseType,
      '{{databaseUrl}}': variables.databaseUrl,
      '{{databaseName}}': variables.databaseName,
      '{{databaseUser}}': variables.databaseUser,
      '{{databasePassword}}': variables.databasePassword,
      '{{databaseHost}}': variables.databaseHost,
      '{{databasePort}}': variables.databasePort.toString(),

      // Database Pool
      '{{dbPoolSize}}': variables.dbPoolSize.toString(),
      '{{dbIdleTimeout}}': variables.dbIdleTimeout.toString(),
      '{{dbConnectionTimeout}}': variables.dbConnectionTimeout.toString(),

      // Performance
      '{{cacheTTL}}': variables.cacheTTL.toString(),
      '{{cacheMaxItems}}': variables.cacheMaxItems.toString(),
      '{{clusterWorkers}}': variables.clusterWorkers,

      // Rate Limiting
      '{{throttleTTL}}': variables.throttleTTL.toString(),
      '{{throttleLimit}}': variables.throttleLimit.toString(),

      // CORS
      '{{allowedOrigins}}': variables.allowedOrigins,

      // Admin User
      '{{adminEmail}}': variables.adminEmail,
      '{{adminPassword}}': variables.adminPassword,
      '{{adminFirstName}}': variables.adminFirstName,
      '{{adminLastName}}': variables.adminLastName,
    };

    let processedContent = content;
    for (const [key, value] of Object.entries(variableMap)) {
      const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
      processedContent = processedContent.replace(regex, value);
    }

    return processedContent;
  }

  private static processPackageJson(content: string, variables: TemplateVariables): string {
    try {
      const packageJson = JSON.parse(content);
      packageJson.name = variables.projectName.toLowerCase().replace(/\s+/g, '-');
      packageJson.description = variables.projectDescription;
      packageJson.version = variables.version;
      if (variables.author) packageJson.author = variables.author;
      return JSON.stringify(packageJson, null, 2);
    } catch {
      return content;
    }
  }
}
