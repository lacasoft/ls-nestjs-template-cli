"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateProcessor = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class TemplateProcessor {
    static async processFiles(projectPath, variables) {
        console.log(chalk_1.default.blue('🔧 Procesando plantillas...'));
        const files = await this.getAllFiles(projectPath);
        for (const file of files) {
            await this.processFile(file, variables);
        }
    }
    static async getAllFiles(dir) {
        const files = [];
        async function scanDirectory(currentPath) {
            const items = await fs_extra_1.default.readdir(currentPath);
            for (const item of items) {
                const fullPath = path_1.default.join(currentPath, item);
                const stat = await fs_extra_1.default.stat(fullPath);
                if (stat.isDirectory()) {
                    if (!['node_modules', '.git', 'dist'].includes(item)) {
                        await scanDirectory(fullPath);
                    }
                }
                else {
                    files.push(fullPath);
                }
            }
        }
        await scanDirectory.call(this, dir);
        return files;
    }
    static async processFile(filePath, variables) {
        try {
            let content = await fs_extra_1.default.readFile(filePath, 'utf8');
            // Reemplazar variables
            content = this.replaceVariables(content, variables);
            // Procesar package.json específicamente
            if (path_1.default.basename(filePath) === 'package.json') {
                content = this.processPackageJson(content, variables);
            }
            await fs_extra_1.default.writeFile(filePath, content, 'utf8');
        }
        catch (error) {
            // Ignorar archivos binarios
        }
    }
    static replaceVariables(content, variables) {
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
    static processPackageJson(content, variables) {
        try {
            const packageJson = JSON.parse(content);
            packageJson.name = variables.projectName.toLowerCase().replace(/\s+/g, '-');
            packageJson.description = variables.projectDescription;
            packageJson.version = variables.version;
            if (variables.author)
                packageJson.author = variables.author;
            return JSON.stringify(packageJson, null, 2);
        }
        catch {
            return content;
        }
    }
}
exports.TemplateProcessor = TemplateProcessor;
