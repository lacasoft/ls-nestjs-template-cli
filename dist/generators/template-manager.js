"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateManager = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class TemplateManager {
    constructor() {
        this.templatesPath = path_1.default.join(__dirname, '..', 'templates');
        this.config = this.loadConfig();
    }
    loadConfig() {
        const configPath = path_1.default.join(this.templatesPath, 'template-config.json');
        if (!fs_extra_1.default.existsSync(configPath)) {
            console.log(chalk_1.default.red('❌ No se encontró template-config.json'));
            return { templates: {} };
        }
        try {
            return fs_extra_1.default.readJsonSync(configPath);
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Error cargando template-config.json:'), error);
            return { templates: {} };
        }
    }
    getAvailableTemplates() {
        return Object.entries(this.config.templates).map(([id, config]) => ({
            id,
            config
        }));
    }
    getTemplate(templateId) {
        return this.config.templates[templateId] || null;
    }
    templateExists(templateId) {
        const templatePath = path_1.default.join(this.templatesPath, templateId);
        return fs_extra_1.default.existsSync(templatePath) && !!this.config.templates[templateId];
    }
    getTemplatePath(templateId) {
        return path_1.default.join(this.templatesPath, templateId);
    }
    listTemplatesByCategory() {
        const templates = this.getAvailableTemplates();
        const categorized = {};
        templates.forEach(template => {
            if (!categorized[template.config.category]) {
                categorized[template.config.category] = [];
            }
            categorized[template.config.category].push(template);
        });
        return categorized;
    }
    displayTemplatesList() {
        const categorized = this.listTemplatesByCategory();
        if (Object.keys(categorized).length === 0) {
            console.log(chalk_1.default.yellow('⚠️  No hay templates configurados.'));
            console.log(chalk_1.default.white('   Crea directorios en templates/ y configura template-config.json'));
            return;
        }
        Object.entries(categorized).forEach(([category, templates]) => {
            console.log(chalk_1.default.yellow(`\n${category.toUpperCase()}:`));
            templates.forEach(template => {
                console.log(chalk_1.default.white(`  🔸 ${chalk_1.default.green(template.id)}`));
                console.log(chalk_1.default.gray(`     ${template.config.description}`));
                if (template.config.features.length > 0) {
                    console.log(chalk_1.default.gray(`     Features: ${template.config.features.join(', ')}`));
                }
                if (template.config.tags.length > 0) {
                    console.log(chalk_1.default.gray(`     Tags: ${template.config.tags.join(', ')}`));
                }
                console.log(''); // Espacio entre templates
            });
        });
    }
}
exports.TemplateManager = TemplateManager;
