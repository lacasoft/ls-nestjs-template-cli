import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export interface TemplateVariables {
  projectName: string;
  projectDescription: string;
  version: string;
  author: string;
  databaseUrl: string;
  jwtSecret: string;
  apiKey: string;
  apiSecret: string;
  port: number;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
  databaseHost: string;
  databasePort: number;
  databaseType: string;
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
    } catch (error) {
      // Ignorar archivos binarios
    }
  }

  private static replaceVariables(content: string, variables: TemplateVariables): string {
    const variableMap = {
      '{{projectName}}': variables.projectName,
      '{{projectNameKebab}}': variables.projectName.toLowerCase().replace(/\s+/g, '-'),
      '{{projectDescription}}': variables.projectDescription,
      '{{version}}': variables.version,
      '{{author}}': variables.author,
      '{{databaseUrl}}': variables.databaseUrl,
      '{{jwtSecret}}': variables.jwtSecret,
      '{{apiKey}}': variables.apiKey,
      '{{apiSecret}}': variables.apiSecret,
      '{{port}}': variables.port.toString(),
      '{{databaseName}}': variables.databaseName,
      '{{databaseUser}}': variables.databaseUser,
      '{{databasePassword}}': variables.databasePassword,
      '{{databaseHost}}': variables.databaseHost,
      '{{databasePort}}': variables.databasePort.toString(),
      '{{databaseType}}': variables.databaseType,
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