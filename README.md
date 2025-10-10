# 🚀 NestJS Template CLI

Una poderosa herramienta de línea de comandos para generar proyectos NestJS con templates personalizados y configuración completa.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green)](https://nodejs.org/)

## ✨ Características

- 🎯 **Templates Profesionales**: Proyectos NestJS listos para producción
- 🗄️ **Multi-Base de Datos**: Soporte para PostgreSQL, MySQL y SQLite
- 🐳 **Docker Multi-Stage**: Builds optimizados para producción
- 🔐 **Seguridad**: Generación automática de secrets y configuración segura
- 🛠️ **TypeScript**: Tipado completo y configuración optimizada
- 📦 **Modular**: Fácil de extender con nuevos templates

## 📋 Requisitos

- Node.js >= 18.x
- npm >= 9.x

## 🔧 Instalación

### Instalación Global

```bash
npm install -g nestjs-template-cli
```

### Instalación Local (Desarrollo)

```bash
git clone <repository-url>
cd ls-nestjs-template-cli
npm install
npm run build
npm link
```

## 🚀 Uso

### Listar Templates Disponibles

```bash
nestjs-template list
```

### Crear un Nuevo Proyecto

```bash
nestjs-template create mi-proyecto
```

El CLI te guiará a través de una serie de preguntas interactivas:

1. **Nombre del proyecto**: Identificador del proyecto
2. **Template**: Selecciona el template base
3. **Descripción**: Breve descripción del proyecto
4. **Versión**: Versión inicial (default: 1.0.0)
5. **Autor**: Tu nombre o el de tu equipo
6. **Puerto**: Puerto de la aplicación (default: 3000)
7. **Base de datos**: ¿Incluir configuración de BD?
   - Tipo: PostgreSQL, MySQL o SQLite
   - Nombre de la base de datos

### Crear Proyecto con Opciones

```bash
nestjs-template create mi-api --template base-nestjs
```

## 📚 Templates Disponibles

### Base NestJS

Template básico con la estructura fundamental de NestJS.

**Incluye:**
- ✅ Estructura básica de NestJS
- ✅ TypeScript configurado
- ✅ Docker multi-stage build
- ✅ Variables de entorno
- ✅ Scripts npm completos
- ✅ Configuración de testing
- ✅ ESLint y Prettier

## 🗄️ Configuración de Base de Datos

### PostgreSQL

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=mydb
```

### MySQL

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=mydb
```

### SQLite

```env
DB_TYPE=sqlite
DB_NAME=mydb
DB_URL=sqlite:./mydb.db
```

## 🐳 Docker

Cada proyecto generado incluye un Dockerfile optimizado con build multi-stage:

### Construir Imagen

```bash
npm run docker:build
```

### Ejecutar Contenedor

```bash
npm run docker:run
```

### Detener Contenedor

```bash
npm run docker:stop
```

### Build Manual

```bash
docker build -t mi-app:latest .
docker run -p 3000:3000 --env-file .env mi-app:latest
```

## 📁 Estructura del Proyecto Generado

```
mi-proyecto/
├── src/
│   ├── app.module.ts
│   └── main.ts
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── nest-cli.json
├── package.json
├── README.md
└── tsconfig.json
```

## 🛠️ Desarrollo

### Estructura del CLI

```
ls-nestjs-template-cli/
├── src/
│   ├── commands/           # Comandos del CLI
│   │   ├── create-project.ts
│   │   └── list-templates.ts
│   ├── generators/         # Generadores de templates
│   │   └── template-manager.ts
│   ├── templates/          # Templates disponibles
│   │   ├── base-nestjs/
│   │   └── template-config.json
│   ├── utils/              # Utilidades
│   │   ├── env-generator.ts
│   │   └── template-processor.ts
│   └── index.ts            # Punto de entrada
├── tests/                  # Tests unitarios
└── package.json
```

### Scripts Disponibles

```bash
# Compilar el proyecto
npm run build

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Cobertura de tests
npm run test:cov
```

## 🧪 Testing

El proyecto incluye tests unitarios con Jest:

```bash
npm test
```

Los tests cubren:
- ✅ Generación de archivos de entorno
- ✅ Procesamiento de templates
- ✅ Gestión de templates
- ✅ Reemplazo de variables

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

## 📝 Variables de Template

Las siguientes variables están disponibles en los templates:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{projectName}}` | Nombre del proyecto | My App |
| `{{projectNameKebab}}` | Nombre en kebab-case | my-app |
| `{{projectDescription}}` | Descripción | My awesome app |
| `{{version}}` | Versión | 1.0.0 |
| `{{author}}` | Autor | John Doe |
| `{{port}}` | Puerto | 3000 |
| `{{databaseType}}` | Tipo de BD | postgres |
| `{{databaseName}}` | Nombre de BD | mydb |
| `{{databaseUser}}` | Usuario de BD | postgres |
| `{{databasePassword}}` | Contraseña de BD | password |
| `{{databaseHost}}` | Host de BD | localhost |
| `{{databasePort}}` | Puerto de BD | 5432 |
| `{{databaseUrl}}` | URL completa de BD | postgresql://... |
| `{{jwtSecret}}` | Secret JWT | (generado) |
| `{{apiKey}}` | API Key | (generado) |
| `{{apiSecret}}` | API Secret | (generado) |

## 🔒 Seguridad

- Los secrets se generan automáticamente usando `crypto.randomBytes()`
- Las contraseñas por defecto deben cambiarse en producción
- Los archivos `.env` están excluidos de git
- Docker ejecuta la app con usuario no privilegiado

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**LACA-SOFT**

- GitHub: [@lacasoft](https://github.com/lacasoft)
- Website: https://lacasoft.com

## 🙏 Agradecimientos

- [NestJS](https://nestjs.com/) - Framework progresivo de Node.js
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - CLI interactiva
- [Chalk](https://github.com/chalk/chalk) - Terminal styling

---

**¿Encontraste un bug?** [Reporta un issue](https://github.com/lacasoft/ls-nestjs-template-cli/issues)

**¿Tienes una idea?** [Sugiere una mejora](https://github.com/lacasoft/ls-nestjs-template-cli/issues)
