import { TemplateManager } from '../generators/template-manager';
import chalk from 'chalk';

export async function listTemplates() {
  const templateManager = new TemplateManager();

  console.log(chalk.blue(`
╔═══════════════════════════════════════╗
║         AVAILABLE TEMPLATES          ║
╚═══════════════════════════════════════╝
  `));

  templateManager.displayTemplatesList();

  console.log(chalk.cyan('\n💡 Usage:'));
  console.log(chalk.white('  nestjs-template create <project-name> --template <template-id>'));
  console.log(chalk.white('  nestjs-template create my-app --template full-starter'));
  console.log(chalk.white('  nestjs-template create my-api --template microservice'));

  console.log(chalk.yellow('\n📖 Ejemplos:'));
  console.log(chalk.white('  # Crear proyecto básico'));
  console.log(chalk.white('  nestjs-template create mi-proyecto --template base-nestjs'));
  console.log(chalk.white(''));
  console.log(chalk.white('  # Crear proyecto completo'));
  console.log(chalk.white('  nestjs-template create mi-api --template full-starter'));
  console.log(chalk.white(''));
  console.log(chalk.white('  # Crear microservicio'));
  console.log(chalk.white('  nestjs-template create mi-service --template microservice'));
}