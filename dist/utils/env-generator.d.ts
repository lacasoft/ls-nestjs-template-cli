import { TemplateVariables } from './template-processor';
export declare class EnvGenerator {
    static generateSecureSecret(length?: number): string;
    static generateEnvFiles(projectPath: string, variables: TemplateVariables): Promise<void>;
    private static generateEnvContent;
    private static generateEnvExampleContent;
}
