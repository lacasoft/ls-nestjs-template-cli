#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import { Command } from 'commander';
import { createProject } from './commands/create-project';
import { listTemplates } from './commands/list-templates';

const program = new Command();

console.log(chalk.blue(figlet.textSync('NestJS CLI', { horizontalLayout: 'full' })));

program.version('1.0.0').description('CLI para generar proyectos NestJS con múltiples templates');

// Comando para listar templates
program
  .command('list')
  .description('Listar todos los templates disponibles')
  .action(async () => {
    await listTemplates();
  });

// Comando principal para crear proyectos
program
  .command('create <project-name>')
  .description('Crear un nuevo proyecto NestJS')
  .option('-t, --template <template>', 'Template específico a usar')
  .option('-f, --features <features...>', 'Características adicionales')
  .action(async (projectName, options) => {
    await createProject(projectName, options);
  });

// Si no se proporcionan comandos, mostrar ayuda
if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.cyan('\n💡 Ejemplos de uso:'));
  console.log(chalk.white('  nestjs-template list'));
  console.log(chalk.white('  nestjs-template create my-app --template full-starter'));
}

program.parse(process.argv);
