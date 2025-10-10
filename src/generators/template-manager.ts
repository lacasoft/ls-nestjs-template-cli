import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export interface TemplateConfig {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  features: string[];
}

export interface TemplatesConfig {
  templates: {
    [key: string]: TemplateConfig;
  };
}

export class TemplateManager {
  private templatesPath: string;
  private config: TemplatesConfig;

  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
    this.config = this.loadConfig();
  }

  private loadConfig(): TemplatesConfig {
    const configPath = path.join(this.templatesPath, 'template-config.json');

    if (!fs.existsSync(configPath)) {
      console.log(chalk.red('❌ No se encontró template-config.json'));
      return { templates: {} };
    }

    try {
      return fs.readJsonSync(configPath);
    } catch (error) {
      console.log(chalk.red('❌ Error cargando template-config.json:'), error);
      return { templates: {} };
    }
  }

  getAvailableTemplates(): { id: string; config: TemplateConfig }[] {
    return Object.entries(this.config.templates).map(([id, config]) => ({
      id,
      config,
    }));
  }

  getTemplate(templateId: string): TemplateConfig | null {
    return this.config.templates[templateId] || null;
  }

  templateExists(templateId: string): boolean {
    const templatePath = path.join(this.templatesPath, templateId);
    return fs.existsSync(templatePath) && !!this.config.templates[templateId];
  }

  getTemplatePath(templateId: string): string {
    return path.join(this.templatesPath, templateId);
  }

  getGlobalConfigPath(): string {
    return path.join(this.templatesPath, '_global');
  }

  listTemplatesByCategory(): { [category: string]: { id: string; config: TemplateConfig }[] } {
    const templates = this.getAvailableTemplates();
    const categorized: { [category: string]: { id: string; config: TemplateConfig }[] } = {};

    templates.forEach((template) => {
      if (!categorized[template.config.category]) {
        categorized[template.config.category] = [];
      }
      categorized[template.config.category].push(template);
    });

    return categorized;
  }

  displayTemplatesList(): void {
    const categorized = this.listTemplatesByCategory();

    if (Object.keys(categorized).length === 0) {
      console.log(chalk.yellow('⚠️  No hay templates configurados.'));
      console.log(
        chalk.white('   Crea directorios en templates/ y configura template-config.json'),
      );
      return;
    }

    Object.entries(categorized).forEach(([category, templates]) => {
      console.log(chalk.yellow(`\n${category.toUpperCase()}:`));

      templates.forEach((template) => {
        console.log(chalk.white(`  🔸 ${chalk.green(template.id)}`));
        console.log(chalk.gray(`     ${template.config.description}`));

        if (template.config.features.length > 0) {
          console.log(chalk.gray(`     Features: ${template.config.features.join(', ')}`));
        }

        if (template.config.tags.length > 0) {
          console.log(chalk.gray(`     Tags: ${template.config.tags.join(', ')}`));
        }
        console.log(''); // Espacio entre templates
      });
    });
  }
}
