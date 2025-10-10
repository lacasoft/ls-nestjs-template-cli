export interface TemplateVariables {
    projectName: string;
    projectDescription: string;
    version: string;
    author: string;
    databaseUrl: string;
    jwtSecret: string;
    apiKey: string;
    apiSecret: string;
    port: number;
    databaseName: string;
    databaseUser: string;
    databasePassword: string;
    databaseHost: string;
    databasePort: number;
    databaseType: string;
}
export declare class TemplateProcessor {
    static processFiles(projectPath: string, variables: TemplateVariables): Promise<void>;
    private static getAllFiles;
    private static processFile;
    private static replaceVariables;
    private static processPackageJson;
}
