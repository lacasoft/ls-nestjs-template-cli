"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const template_manager_1 = require("../generators/template-manager");
const template_processor_1 = require("../utils/template-processor");
const env_generator_1 = require("../utils/env-generator");
async function createProject(projectName, options) {
    const templateManager = new template_manager_1.TemplateManager();
    console.log(chalk_1.default.green('🚀 NestJS Template CLI - Create Project\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'Nombre del proyecto:',
            default: projectName || 'my-nestjs-app',
            validate: (input) => {
                if (/^([A-Za-z\-\_\d])+$/.test(input))
                    return true;
                return 'Nombre inválido. Use solo letras, números, guiones y guiones bajos.';
            },
        },
        {
            type: 'list',
            name: 'templateId',
            message: 'Selecciona el template base:',
            choices: () => {
                const templates = templateManager.getAvailableTemplates();
                return templates.map(template => ({
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
            default: (answers) => `${answers.projectName.toLowerCase().replace(/\s+/g, '_')}_dev`,
            when: (answers) => answers.database,
        },
    ]);
    // Generar variables dinámicas según el tipo de base de datos
    const dbConfig = getDatabaseConfig(answers.databaseType);
    const templateVariables = {
        projectName: answers.projectName,
        projectDescription: answers.projectDescription,
        version: answers.version,
        author: answers.author,
        port: answers.port,
        databaseUrl: generateDatabaseUrl(answers),
        jwtSecret: env_generator_1.EnvGenerator.generateSecureSecret(),
        apiKey: env_generator_1.EnvGenerator.generateSecureSecret(16),
        apiSecret: env_generator_1.EnvGenerator.generateSecureSecret(24),
        databaseName: answers.databaseName || '',
        databaseUser: dbConfig.user,
        databasePassword: dbConfig.password,
        databaseHost: dbConfig.host,
        databasePort: dbConfig.port,
        databaseType: answers.databaseType || 'postgres',
    };
    await generateProject(answers.projectName, answers.templateId, templateVariables, templateManager);
}
exports.createProject = createProject;
async function generateProject(projectName, templateId, variables, templateManager) {
    const projectPath = path_1.default.resolve(process.cwd(), projectName);
    // Verificar si existe
    if (fs_extra_1.default.existsSync(projectPath)) {
        const { overwrite } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `El directorio ${projectName} ya existe. ¿Sobrescribir?`,
                default: false,
            },
        ]);
        if (!overwrite) {
            console.log(chalk_1.default.yellow('❌ Operación cancelada.'));
            return;
        }
        fs_extra_1.default.removeSync(projectPath);
    }
    console.log(chalk_1.default.blue(`📁 Creando proyecto: ${projectName}`));
    console.log(chalk_1.default.blue(`📋 Usando template: ${templateId}`));
    // Crear directorio
    fs_extra_1.default.ensureDirSync(projectPath);
    // Verificar que el template existe
    if (!templateManager.templateExists(templateId)) {
        console.log(chalk_1.default.red(`❌ Template "${templateId}" no encontrado.`));
        console.log(chalk_1.default.white('   Usa "nestjs-template list" para ver templates disponibles.'));
        return;
    }
    // Copiar template
    const templatePath = templateManager.getTemplatePath(templateId);
    try {
        await fs_extra_1.default.copy(templatePath, projectPath);
        console.log(chalk_1.default.green('✅ Template copiado correctamente'));
        // Procesar templates
        await template_processor_1.TemplateProcessor.processFiles(projectPath, variables);
        console.log(chalk_1.default.green('✅ Variables procesadas correctamente'));
        // Generar archivos de entorno
        await env_generator_1.EnvGenerator.generateEnvFiles(projectPath, variables);
        console.log(chalk_1.default.green('✅ Archivos de entorno generados correctamente'));
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Error generando proyecto:'), error);
        return;
    }
    console.log(chalk_1.default.green(`\n🎉 Proyecto ${projectName} creado exitosamente!`));
    displayNextSteps(projectName, variables);
}
function displayNextSteps(projectName, variables) {
    console.log(chalk_1.default.cyan('\n📋 Próximos pasos:'));
    console.log(chalk_1.default.white(`  cd ${projectName}`));
    console.log(chalk_1.default.white('  npm install'));
    console.log(chalk_1.default.white('  npm run start:dev'));
    console.log(chalk_1.default.blue(`\n📍 La aplicación estará en: http://localhost:${variables.port}`));
}
// Helper function to get database configuration
function getDatabaseConfig(databaseType) {
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
function generateDatabaseUrl(details) {
    if (!details.database)
        return '';
    const dbName = details.databaseName || `${details.projectName.toLowerCase().replace(/\s+/g, '_')}_dev`;
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
