# {{projectName}}

{{projectDescription}}

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Migraciones de Base de Datos](#-migraciones-de-base-de-datos)
- [Testing](#-testing)
- [Docker](#-docker)
- [Documentación API](#-documentación-api)
- [Seguridad](#-seguridad)
- [Métricas y Monitoreo](#-métricas-y-monitoreo)

## 🚀 Características

### Seguridad

- ✅ Autenticación JWT con refresh tokens
- ✅ Validación de API Key/Secret
- ✅ Rate limiting personalizado
- ✅ Helmet para seguridad de headers HTTP
- ✅ CORS configurable
- ✅ Sanitización de inputs
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación robusta de contraseñas

### Rendimiento

- ✅ Caché en memoria (cache-manager)
- ✅ Compresión de respuestas HTTP
- ✅ Clustering para multi-core
- ✅ Connection pooling de base de datos

### Observabilidad

- ✅ Logging estructurado (Winston)
- ✅ Health checks (Terminus)
- ✅ Métricas Prometheus
- ✅ Documentación Swagger/OpenAPI

### Desarrollo

- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ Hot reload
- ✅ Testing (Jest)
- ✅ Migraciones TypeORM
- ✅ Docker multi-stage build

## 🛠 Tecnologías

- **Framework**: NestJS 11.x
- **Runtime**: Node.js 22.x
- **Lenguaje**: TypeScript 5.x
- **Base de Datos**: {{databaseType}}
- **ORM**: TypeORM 0.3.x
- **Autenticación**: Passport + JWT
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston
- **Métricas**: Prometheus

## 📦 Requisitos Previos

- Node.js >= 22.14.0
- npm >= 10.x
- {{databaseType}} (base de datos)
- Docker (opcional)

## 🔧 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd {{projectNameKebab}}

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# App
NODE_ENV=development
APP_NAME={{projectName}}
PORT={{port}}
API_KEY={{apiKey}}
API_SECRET={{apiSecret}}
JWT_SECRET={{jwtSecret}}
JWT_EXPIRES_IN={{jwtExpiresIn}}

# Database
DB_TYPE={{databaseType}}
DB_HOST={{databaseHost}}
DB_PORT={{databasePort}}
DB_USERNAME={{databaseUser}}
DB_PASSWORD={{databasePassword}}
DB_NAME={{databaseName}}

# Seguridad
ALLOWED_ORIGINS={{allowedOrigins}}
JWT_REFRESH_SECRET={{jwtRefreshSecret}}
JWT_REFRESH_EXPIRES_IN={{jwtRefreshExpiresIn}}

# Performance
CACHE_TTL={{cacheTTL}}
CACHE_MAX_ITEMS={{cacheMaxItems}}
CLUSTER_WORKERS={{clusterWorkers}}

# Database Pool
DB_POOL_SIZE={{dbPoolSize}}
DB_IDLE_TIMEOUT={{dbIdleTimeout}}
DB_CONNECTION_TIMEOUT={{dbConnectionTimeout}}

# Rate Limiting
THROTTLE_TTL={{throttleTTL}}
THROTTLE_LIMIT={{throttleLimit}}
```

## 📁 Estructura del Proyecto

```
{{projectNameKebab}}/
├── src/
│   ├── common/                    # Código compartido
│   │   ├── cache/                # Configuración de caché
│   │   ├── decorators/           # Decoradores personalizados
│   │   ├── guards/               # Guards (JWT, Rate Limit)
│   │   ├── interceptors/         # Interceptores HTTP
│   │   ├── metrics/              # Módulo de métricas
│   │   ├── middleware/           # Middlewares (Security, API Key)
│   │   ├── pipes/                # Pipes de validación
│   │   └── utils/                # Utilidades (password, etc.)
│   │
│   ├── config/                   # Configuraciones
│   │   ├── app.config.ts         # Config general de la app
│   │   ├── database.config.ts    # Config de TypeORM (NestJS)
│   │   ├── typeorm.config.ts     # Config de TypeORM (CLI)
│   │   ├── logger.config.ts      # Config de Winston
│   │   └── security.config.ts    # Config de seguridad
│   │
│   ├── database/                 # Base de datos
│   │   └── migrations/           # Migraciones TypeORM
│   │
│   ├── modules/                  # Módulos de negocio
│   │   ├── auth/                 # Autenticación y autorización
│   │   │   ├── dto/              # DTOs de autenticación
│   │   │   ├── strategies/       # Estrategias Passport (JWT, Refresh)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── health/               # Health checks
│   │   │   ├── health.controller.ts
│   │   │   ├── advanced-health.controller.ts
│   │   │   └── health.module.ts
│   │   │
│   │   └── users/                # Gestión de usuarios
│   │       ├── dto/              # DTOs de usuarios
│   │       ├── entities/         # Entidades TypeORM
│   │       ├── repositories/     # Repositorios personalizados
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       └── users.module.ts
│   │
│   ├── shared/                   # Interfaces y tipos compartidos
│   │   └── interfaces/
│   │
│   ├── app.module.ts             # Módulo principal
│   ├── main.ts                   # Punto de entrada
│   └── cluster.ts                # Configuración de clustering
│
├── test/                         # Tests E2E
├── .dockerignore                 # Exclusiones de Docker
├── .env                          # Variables de entorno (no committed)
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore                    # Exclusiones de Git
├── .prettierrc                   # Configuración Prettier
├── Dockerfile                    # Imagen Docker multi-stage
├── eslint.config.mjs             # Configuración ESLint
├── nest-cli.json                 # Configuración NestJS CLI
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración TypeScript
└── tsconfig.build.json           # Configuración TypeScript para build
```

## 💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run start:dev

# Modo debug
npm run start:debug

# Producción
npm run build
npm run start:prod

# Linting y formato
npm run format

# Testing
npm run test
npm run test:watch
npm run test:cov
```

### Crear Nuevos Módulos

```bash
# Generar módulo completo
nest g module modules/nombre-modulo
nest g controller modules/nombre-modulo
nest g service modules/nombre-modulo

# Generar entidad
nest g class modules/nombre-modulo/entities/nombre.entity --no-spec

# Generar DTO
nest g class modules/nombre-modulo/dto/create-nombre.dto --no-spec
```

## 🗄 Migraciones de Base de Datos

### Generar Migración

Después de crear/modificar entidades:

```bash
npm run migration:generate
```

Esto creará una migración en `src/database/migrations/` con los cambios detectados.

### Ejecutar Migraciones

```bash
npm run migration:run
```

### Revertir Última Migración

```bash
npm run migration:revert
```

### Crear Migración Vacía

```bash
npm run typeorm -- migration:create ./src/database/migrations/NombreMigracion
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🐳 Docker

### Build de la Imagen

```bash
docker build -t {{projectNameKebab}} .
```

### Ejecutar Contenedor

```bash
docker run -p {{port}}:{{port}} --env-file .env {{projectNameKebab}}
```

### Docker Compose (Ejemplo)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "{{port}}:{{port}}"
    environment:
      - NODE_ENV=production
      - DB_HOST={{databaseType}}
    depends_on:
      - {{databaseType}}

  {{databaseType}}:
    image: {{databaseType}}:16-alpine
    environment:
      POSTGRES_DB: {{databaseName}}
      POSTGRES_USER: {{databaseUser}}
      POSTGRES_PASSWORD: {{databasePassword}}
    volumes:
      - {{databaseType}}_data:/var/lib/postgresql/data

volumes:
  {{databaseType}}_data:
```

## 📚 Documentación API

### Swagger UI

Una vez iniciada la aplicación, accede a:

```
http://localhost:{{port}}/api
```

### Autenticación en Swagger

La API soporta tres métodos de autenticación:

1. **Bearer Token (JWT)**
   - Login: `POST /auth/login`
   - Usar el token en header: `Authorization: Bearer <token>`

2. **API Key**
   - Header: `x-api-key: <your-api-key>`

3. **API Secret**
   - Header: `x-api-secret: <your-api-secret>`

## 🔒 Seguridad

### Headers de Seguridad

El proyecto usa Helmet para configurar headers HTTP seguros:

- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

### Rate Limiting

**Protección Global Activa:**

- ✅ Aplicado a **TODAS** las rutas automáticamente
- **Límite**: 100 requests por minuto por IP
- **Headers informativos**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Tracking inteligente**: Considera IPs detrás de proxies (nginx, cloudflare, etc.)

**Configuración** (`.env`):

```env
THROTTLE_TTL=60000    # 1 minuto en ms
THROTTLE_LIMIT=100    # 100 requests máximo
```

**Respuesta cuando se excede:**

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests"
}
```

### Validación de Contraseñas

Las contraseñas deben cumplir:

- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial

### API Keys

**Rutas públicas** (No requieren API Key):

- `/health` - Health check básico
- `/users` (POST) - Registro de usuario
- `/metrics` - Métricas Prometheus

**Rutas que requieren API Key + API Secret**:

- `/auth/login` - Login de usuario

**Rutas protegidas** (Requieren JWT + API Key):

- Todas las demás rutas

## 📊 Métricas y Monitoreo

### Health Checks

```bash
# Health check básico
GET /health

# Health check avanzado (database, memoria, disco)
GET /health/advanced
```

### Métricas Prometheus

```bash
GET /metrics
```

Métricas disponibles:

- HTTP request duration
- HTTP request total
- Active connections
- Memory usage
- CPU usage

### Logs

Los logs se almacenan en:

- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

Formato: JSON estructurado con timestamp, level, message y metadata.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 Licencia

MIT

## 👥 Autores

{{author}}

## 📞 Soporte

Para reportar bugs o solicitar features, por favor crea un issue en el repositorio.
