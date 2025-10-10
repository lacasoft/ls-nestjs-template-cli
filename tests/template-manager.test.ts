import { TemplateManager } from '../src/generators/template-manager';
import * as path from 'path';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe('getAvailableTemplates', () => {
    it('should return an array of templates', () => {
      const templates = templateManager.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return at least one template (base-nestjs)', () => {
      const templates = templateManager.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
      const baseTemplate = templates.find(t => t.id === 'base-nestjs');
      expect(baseTemplate).toBeDefined();
    });
  });

  describe('getTemplate', () => {
    it('should return template config for valid template id', () => {
      const template = templateManager.getTemplate('base-nestjs');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Base NestJS');
    });

    it('should return null for invalid template id', () => {
      const template = templateManager.getTemplate('non-existent-template');
      expect(template).toBeNull();
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', () => {
      const exists = templateManager.templateExists('base-nestjs');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing template', () => {
      const exists = templateManager.templateExists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('getTemplatePath', () => {
    it('should return correct path for template', () => {
      const templatePath = templateManager.getTemplatePath('base-nestjs');
      expect(templatePath).toContain('base-nestjs');
      expect(path.isAbsolute(templatePath) || templatePath.includes('templates')).toBe(true);
    });
  });

  describe('listTemplatesByCategory', () => {
    it('should return templates grouped by category', () => {
      const categorized = templateManager.listTemplatesByCategory();
      expect(typeof categorized).toBe('object');
      expect(categorized['basic']).toBeDefined();
      expect(Array.isArray(categorized['basic'])).toBe(true);
    });

    it('should include base-nestjs in basic category', () => {
      const categorized = templateManager.listTemplatesByCategory();
      const basicTemplates = categorized['basic'];
      const hasBaseNestjs = basicTemplates.some(t => t.id === 'base-nestjs');
      expect(hasBaseNestjs).toBe(true);
    });
  });
});
