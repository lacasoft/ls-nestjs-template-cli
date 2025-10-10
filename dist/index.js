#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const commander_1 = require("commander");
const create_project_1 = require("./commands/create-project");
const list_templates_1 = require("./commands/list-templates");
const program = new commander_1.Command();
console.log(chalk_1.default.blue(figlet_1.default.textSync('NestJS CLI', { horizontalLayout: 'full' })));
program
    .version('1.0.0')
    .description('CLI para generar proyectos NestJS con múltiples templates');
// Comando para listar templates
program
    .command('list')
    .description('Listar todos los templates disponibles')
    .action(async () => {
    await (0, list_templates_1.listTemplates)();
});
// Comando principal para crear proyectos
program
    .command('create <project-name>')
    .description('Crear un nuevo proyecto NestJS')
    .option('-t, --template <template>', 'Template específico a usar')
    .option('-f, --features <features...>', 'Características adicionales')
    .action(async (projectName, options) => {
    await (0, create_project_1.createProject)(projectName, options);
});
// Si no se proporcionan comandos, mostrar ayuda
if (!process.argv.slice(2).length) {
    program.outputHelp();
    console.log(chalk_1.default.cyan('\n💡 Ejemplos de uso:'));
    console.log(chalk_1.default.white('  nestjs-template list'));
    console.log(chalk_1.default.white('  nestjs-template create my-app --template full-starter'));
}
program.parse(process.argv);
