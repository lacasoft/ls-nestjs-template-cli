"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplates = void 0;
const template_manager_1 = require("../generators/template-manager");
const chalk_1 = __importDefault(require("chalk"));
async function listTemplates() {
    const templateManager = new template_manager_1.TemplateManager();
    console.log(chalk_1.default.blue(`
╔═══════════════════════════════════════╗
║         AVAILABLE TEMPLATES          ║
╚═══════════════════════════════════════╝
  `));
    templateManager.displayTemplatesList();
    console.log(chalk_1.default.cyan('\n💡 Usage:'));
    console.log(chalk_1.default.white('  nestjs-template create <project-name> --template <template-id>'));
    console.log(chalk_1.default.white('  nestjs-template create my-app --template full-starter'));
    console.log(chalk_1.default.white('  nestjs-template create my-api --template microservice'));
    console.log(chalk_1.default.yellow('\n📖 Ejemplos:'));
    console.log(chalk_1.default.white('  # Crear proyecto básico'));
    console.log(chalk_1.default.white('  nestjs-template create mi-proyecto --template base-nestjs'));
    console.log(chalk_1.default.white(''));
    console.log(chalk_1.default.white('  # Crear proyecto completo'));
    console.log(chalk_1.default.white('  nestjs-template create mi-api --template full-starter'));
    console.log(chalk_1.default.white(''));
    console.log(chalk_1.default.white('  # Crear microservicio'));
    console.log(chalk_1.default.white('  nestjs-template create mi-service --template microservice'));
}
exports.listTemplates = listTemplates;
