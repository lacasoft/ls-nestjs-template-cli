# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a NestJS Template CLI! Este documento te guiará a través del proceso.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)

## 📜 Código de Conducta

Este proyecto sigue un código de conducta. Al participar, se espera que respetes este código.

### Nuestros Estándares

- Usa un lenguaje acogedor e inclusivo
- Respeta diferentes puntos de vista y experiencias
- Acepta críticas constructivas con gracia
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

## 🛠️ ¿Cómo puedo contribuir?

### Reportar Bugs

Los bugs se rastrean como issues de GitHub. Antes de crear un issue:

1. **Verifica si el bug ya fue reportado** buscando en los issues existentes
2. Si no existe, crea uno nuevo incluyendo:
   - Título claro y descriptivo
   - Pasos detallados para reproducir el problema
   - Comportamiento esperado vs comportamiento actual
   - Capturas de pantalla si es aplicable
   - Versión de Node.js, npm y del CLI
   - Sistema operativo

### Sugerir Mejoras

Las sugerencias también se rastrean como issues. Incluye:

- Descripción clara de la mejora
- Explicación de por qué sería útil
- Ejemplos de cómo se usaría
- Posibles alternativas consideradas

### Contribuir con Código

1. **Elige un issue** o crea uno para discutir tu idea
2. **Fork el repositorio**
3. **Crea una rama** desde `main`
4. **Implementa tus cambios**
5. **Escribe o actualiza tests**
6. **Asegúrate que los tests pasen**
7. **Envía un Pull Request**

## 🔧 Configuración del Entorno

### Prerequisitos

- Node.js >= 18.x
- npm >= 9.x
- Git

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/ls-nestjs-template-cli.git
cd ls-nestjs-template-cli

# Instalar dependencias
npm install

# Compilar el proyecto
npm run build

# Enlazar globalmente para testing
npm link
```

### Verificar Instalación

```bash
# Debería mostrar el help del CLI
nestjs-template --help

# Listar templates
nestjs-template list
```

## 💻 Proceso de Desarrollo

### Estructura del Proyecto

```
src/
├── commands/           # Comandos CLI
├── generators/         # Lógica de generación
├── templates/          # Templates de proyectos
├── utils/             # Utilidades
└── index.ts           # Entry point

tests/                 # Tests unitarios
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev              # Ejecutar en modo desarrollo
npm run build           # Compilar TypeScript

# Testing
npm test                # Ejecutar tests
npm run test:watch      # Tests en modo watch
npm run test:cov        # Cobertura de tests

# Linting y Formateo
npm run lint            # Verificar código con ESLint
npm run lint:fix        # Corregir problemas de ESLint automáticamente
npm run format          # Formatear código con Prettier
npm run format:check    # Verificar formato sin modificar archivos
```

### Agregar un Nuevo Template

1. Crea un directorio en `src/templates/`
2. Agrega los archivos del template con variables `{{variableName}}`
3. Actualiza `src/templates/template-config.json`:

```json
{
  "templates": {
    "tu-template": {
      "name": "Tu Template",
      "description": "Descripción del template",
      "version": "1.0.0",
      "category": "basic|advanced|microservice",
      "tags": ["tag1", "tag2"],
      "features": ["feature1", "feature2"]
    }
  }
}
```

### Variables Disponibles en Templates

Todas las variables en `TemplateVariables` (src/utils/template-processor.ts):

- `{{projectName}}`
- `{{projectNameKebab}}`
- `{{projectDescription}}`
- `{{version}}`
- `{{author}}`
- `{{port}}`
- `{{databaseType}}`
- `{{databaseName}}`
- `{{databaseUser}}`
- `{{databasePassword}}`
- `{{databaseHost}}`
- `{{databasePort}}`
- `{{databaseUrl}}`
- `{{jwtSecret}}`
- `{{apiKey}}`
- `{{apiSecret}}`

## 📏 Estándares de Código

### TypeScript

- Usa **TypeScript** para todo el código
- Define tipos explícitos, evita `any`
- Usa interfaces para estructuras de datos
- Documenta funciones públicas con JSDoc

```typescript
/**
 * Genera archivos de entorno para el proyecto
 * @param projectPath - Ruta del proyecto
 * @param variables - Variables del template
 */
async function generateEnvFiles(projectPath: string, variables: TemplateVariables): Promise<void> {
  // Implementation
}
```

### Estilo de Código

- **Indentación**: 2 espacios
- **Comillas**: Simples `'string'`
- **Punto y coma**: Obligatorio
- **Nombres**:
  - `camelCase` para variables y funciones
  - `PascalCase` para clases e interfaces
  - `UPPER_CASE` para constantes

### Testing

- Escribe tests para nuevas funcionalidades
- Mantén la cobertura > 80%
- Usa nombres descriptivos para los tests

```typescript
describe('EnvGenerator', () => {
  describe('generateSecureSecret', () => {
    it('should generate a secret with default length of 32', () => {
      const secret = EnvGenerator.generateSecureSecret();
      expect(secret.length).toBe(64);
    });
  });
});
```

## 📝 Commits

Este proyecto usa **validación automática de commits** con:

- ✅ **Husky**: Git hooks automatizados
- ✅ **Commitlint**: Validación de formato de commits
- ✅ **Prettier**: Formateo automático de código
- ✅ **ESLint**: Linting de TypeScript

### Formato de Commit

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos Permitidos

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formateo, sin cambios de código
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento (dependencias, configs, etc)
- `revert`: Revertir un commit anterior
- `build`: Cambios en build system o dependencias
- `ci`: Cambios en CI/CD

### Validaciones Automáticas

Cuando hagas `git commit`, el sistema automáticamente:

1. **Pre-commit hook** (antes del commit):
   - ✅ Ejecuta **Prettier** en archivos modificados
   - ✅ Ejecuta **ESLint** con auto-fix en archivos TypeScript
   - ❌ **Bloquea el commit** si hay errores de linting

2. **Commit-msg hook** (valida el mensaje):
   - ✅ Verifica que el mensaje siga el formato Conventional Commits
   - ✅ Valida que el tipo sea uno de los permitidos
   - ✅ Verifica que el scope esté en lowercase
   - ✅ Máximo 100 caracteres en el header
   - ❌ **Rechaza el commit** si no cumple las reglas

### Ejemplos Válidos

```bash
✅ feat(templates): add GraphQL API template
✅ fix(env-generator): correct MySQL port configuration
✅ docs(readme): update installation instructions
✅ test(template-processor): add tests for variable replacement
✅ chore(deps): update typescript to v5.0.0
```

### Ejemplos Inválidos

```bash
❌ Add new template                    # Falta tipo y scope
❌ feat add template                   # Falta paréntesis en scope
❌ FEAT(templates): add template       # Tipo debe estar en lowercase
❌ feat(Templates): add template       # Scope debe estar en lowercase
❌ feat(templates) add template        # Falta dos puntos después del scope
```

### Bypass de Validaciones (NO RECOMENDADO)

Solo en casos extremos, puedes hacer bypass con:

```bash
# Bypass de pre-commit (NO ejecuta prettier/eslint)
git commit --no-verify -m "feat(scope): message"

# ⚠️ NO SE RECOMIENDA - Puede introducir código sin formatear
```

## 🔄 Pull Requests

### Antes de Enviar

1. ✅ Los tests pasan: `npm test`
2. ✅ El proyecto compila: `npm run build`
3. ✅ El código sigue los estándares
4. ✅ Los commits siguen la convención
5. ✅ La documentación está actualizada

### Formato del PR

**Título**: Claro y descriptivo

**Descripción**:

```markdown
## Descripción

Breve descripción de los cambios

## Tipo de cambio

- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?

Describe las pruebas realizadas

## Checklist

- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] Cambios probados localmente
```

### Proceso de Review

1. Un mantenedor revisará tu PR
2. Puede solicitar cambios
3. Realiza los cambios solicitados
4. Una vez aprobado, se hará merge

## 🐛 Reportar Bugs

### Template de Bug Report

```markdown
**Descripción del bug**
Descripción clara y concisa del bug.

**Pasos para reproducir**

1. Ejecutar '...'
2. Con opciones '...'
3. Ver error

**Comportamiento esperado**
Lo que esperabas que sucediera.

**Comportamiento actual**
Lo que realmente sucede.

**Capturas de pantalla**
Si aplica, agrega capturas.

**Entorno:**

- OS: [e.g. Ubuntu 22.04]
- Node: [e.g. 18.16.0]
- npm: [e.g. 9.5.1]
- CLI Version: [e.g. 1.0.0]

**Contexto adicional**
Cualquier otra información relevante.
```

## ✅ Lista de Verificación Final

Antes de enviar tu contribución:

- [ ] El código compila sin errores
- [ ] Todos los tests pasan
- [ ] Se agregaron tests para nuevas funcionalidades
- [ ] La documentación está actualizada
- [ ] Los commits siguen la convención
- [ ] El PR tiene una descripción clara
- [ ] Se verificó en múltiples escenarios

## 🙏 Agradecimientos

¡Gracias por contribuir a NestJS Template CLI! Cada contribución, grande o pequeña, es valiosa.

## 📧 ¿Preguntas?

Si tienes preguntas, puedes:

- Abrir un issue con la etiqueta `question`
- Contactar a los mantenedores directamente

---

**¡Feliz coding! 🚀**
