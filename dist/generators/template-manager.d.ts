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
export declare class TemplateManager {
    private templatesPath;
    private config;
    constructor();
    private loadConfig;
    getAvailableTemplates(): {
        id: string;
        config: TemplateConfig;
    }[];
    getTemplate(templateId: string): TemplateConfig | null;
    templateExists(templateId: string): boolean;
    getTemplatePath(templateId: string): string;
    listTemplatesByCategory(): {
        [category: string]: {
            id: string;
            config: TemplateConfig;
        }[];
    };
    displayTemplatesList(): void;
}
