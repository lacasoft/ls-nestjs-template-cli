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
- [Sistema de Roles y Permisos](#-sistema-de-roles-y-permisos)
- [Migraciones de Base de Datos](#-migraciones-de-base-de-datos)
- [Testing](#-testing)
- [Docker](#-docker)
- [Documentación API](#-documentación-api)
- [Seguridad](#-seguridad)
- [Métricas y Monitoreo](#-métricas-y-monitoreo)

## 🚀 Características

### Seguridad

- ✅ Autenticación JWT con refresh tokens
- ✅ **Sistema completo de Roles y Permisos (RBAC)**
- ✅ Token blacklist para logout seguro
- ✅ Validación de API Key/Secret
- ✅ Rate limiting personalizado por endpoint
- ✅ Helmet para seguridad de headers HTTP
- ✅ CORS configurable
- ✅ Sanitización de inputs
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación robusta de contraseñas
- ✅ Protección del último super admin

### Rendimiento

- ✅ Caché Redis para sesiones y permisos
- ✅ Caché inteligente de permisos de usuario
- ✅ Compresión de respuestas HTTP
- ✅ Clustering para multi-core
- ✅ Connection pooling de base de datos
- ✅ Paginación en todos los endpoints de listado

### Observabilidad

- ✅ Logging estructurado (Winston)
- ✅ Health checks completos (Database, Redis, Email, Memory, Disk)
- ✅ Health checks individuales por servicio
- ✅ Métricas Prometheus
- ✅ Documentación Swagger/OpenAPI completa

### Desarrollo

- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ Hot reload
- ✅ Testing unitario y E2E (Jest)
- ✅ Migraciones TypeORM automáticas
- ✅ Seeders para roles, permisos y super admin
- ✅ Docker multi-stage build
- ✅ Soft delete en roles y permisos
- ✅ Gestión completa de preferencias de usuario

## 🛠 Tecnologías

- **Framework**: NestJS 11.x
- **Runtime**: Node.js 22.x
- **Lenguaje**: TypeScript 5.x
- **Base de Datos**: {{databaseType}}
- **ORM**: TypeORM 0.3.x
- **Caché**: Redis (cache-manager)
- **Autenticación**: Passport + JWT
- **Validación**: class-validator + class-transformer
- **Email**: Nodemailer con plantillas Handlebars
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston
- **Métricas**: Prometheus
- **Health Checks**: @nestjs/terminus

## 📦 Requisitos Previos

- Node.js >= 22.14.0
- npm >= 10.x
- {{databaseType}} (base de datos)
- Redis >= 7.x (para caché y sesiones)
- Docker (opcional)
- SMTP server (para envío de emails)

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
DB_SSL=false

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
│   │   ├── migrations/           # Migraciones TypeORM
│   │   └── seeds/                # 🆕 Seeders (roles, permisos, admin)
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
│   │   ├── roles/                # 🆕 Gestión de roles y permisos
│   │   │   ├── dto/              # DTOs de roles y permisos
│   │   │   ├── entities/         # Entidades Role y Permission
│   │   │   ├── roles.controller.ts
│   │   │   ├── roles.service.ts
│   │   │   └── roles.module.ts
│   │   │
│   │   └── users/                # Gestión de usuarios
│   │       ├── constants/        # Cache keys y constantes
│   │       ├── dto/              # DTOs de usuarios
│   │       │   ├── create-user.dto.ts
│   │       │   ├── update-profile.dto.ts
│   │       │   ├── change-password.dto.ts
│   │       │   ├── update-preferences.dto.ts
│   │       │   └── user-permissions-response.dto.ts
│   │       ├── entities/         # Entidades TypeORM
│   │       │   ├── user.entity.ts
│   │       │   └── user-preferences.entity.ts
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

## 🔐 Sistema de Roles y Permisos

El proyecto incluye un sistema completo de **RBAC (Role-Based Access Control)** con roles y permisos granulares.

### Roles Predefinidos

| Rol           | Descripción                    | Permisos            |
| ------------- | ------------------------------ | ------------------- |
| `super_admin` | Acceso total al sistema        | 18 permisos (todos) |
| `admin`       | Administrador del sistema      | 11 permisos         |
| `supervisor`  | Supervisor con acceso limitado | 8 permisos          |
| `observer`    | Solo lectura                   | 4 permisos          |

### Permisos Disponibles

Los permisos siguen el patrón `resource:action`:

**Usuarios:**

- `users:create`, `users:read`, `users:update`, `users:delete`

**Roles:**

- `roles:create`, `roles:read`, `roles:update`, `roles:delete`

**Permisos:**

- `permissions:create`, `permissions:read`, `permissions:update`, `permissions:delete`

**Reportes:**

- `reports:create`, `reports:read`, `reports:export`

**Configuración:**

- `settings:read`, `settings:update`

**Auditoría:**

- `audit:read`

### Uso de Guards

```typescript
// Proteger endpoint por roles
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@Get('admin-data')
getAdminData() {
  // Solo accesible por super_admin y admin
}

// Proteger endpoint por permisos específicos
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('users:create', 'users:update')
@Post('users')
createUser() {
  // Solo accesible con ambos permisos
}
```

### Seeder de Roles y Permisos

El proyecto incluye un seeder automático que crea:

- 4 roles predefinidos
- 18 permisos base
- Usuario administrador con rol `super_admin`

```bash
# Ejecutar seeder (crea roles, permisos y admin)
npm run seed:admin
```

**Variables de entorno para el admin:**

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123!@#
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

### API de Roles y Permisos

**Endpoints disponibles:**

```bash
# Roles (con paginación)
GET    /roles              # Listar todos los roles (paginado)
                          # Query params: page, limit, sortBy, sortOrder
GET    /roles/:id          # Obtener rol por ID
POST   /roles              # Crear nuevo rol
PATCH  /roles/:id          # Actualizar rol
DELETE /roles/:id          # Soft delete de rol
PATCH  /roles/:id/restore  # Restaurar rol eliminado

# Permisos (con paginación)
GET    /roles/permissions/all     # Listar todos los permisos (paginado)
                                  # Query params: page, limit, sortBy, sortOrder
GET    /roles/permissions/:id     # Obtener permiso por ID
POST   /roles/permissions         # Crear nuevo permiso
PATCH  /roles/permissions/:id     # Actualizar permiso
DELETE /roles/permissions/:id     # Soft delete de permiso
PATCH  /roles/permissions/:id/restore  # Restaurar permiso eliminado

# Asignación de permisos a roles
POST   /roles/:id/permissions     # Asignar permisos a rol
DELETE /roles/:id/permissions     # Remover permisos de rol

# Usuarios (con paginación)
GET    /users              # Listar todos los usuarios (paginado)
                          # Query params: page, limit, sortBy, sortOrder
GET    /users/me           # Obtener perfil del usuario actual
PATCH  /users/me           # Actualizar perfil del usuario actual
PATCH  /users/me/password  # Cambiar contraseña del usuario actual
GET    /users/me/permissions      # Obtener permisos del usuario actual (cacheado)
GET    /users/me/preferences      # Obtener preferencias del usuario
PATCH  /users/me/preferences      # Actualizar preferencias del usuario
GET    /users/:id          # Obtener usuario por ID
POST   /users              # Crear nuevo usuario
```

**Características de paginación:**

- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 10, max: 100)
- `sortBy`: Campo para ordenar (default: createdAt)
- `sortOrder`: Orden ASC o DESC (default: DESC)

**Respuesta paginada:**

```json
{
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

Ver [TESTING_ROLES_PERMISSIONS.md](TESTING_ROLES_PERMISSIONS.md) para guía completa de testing.

## 👤 Gestión de Usuarios

### Características de Usuario

El sistema incluye gestión completa del ciclo de vida de usuarios:

**Perfil de Usuario:**

- ✅ Actualización de perfil (nombre, apellido, teléfono)
- ✅ Cambio de contraseña con validación
- ✅ Gestión de preferencias personalizadas
- ✅ Consulta de permisos propios (cacheado)

**Preferencias de Usuario:**

```typescript
{
  language: 'en' | 'es',           // Idioma preferido
  theme: 'light' | 'dark' | 'auto', // Tema visual
  currency: 'CLP' | 'USD' | 'EUR' | 'MXN' | 'ARS',
  timezone: string,                 // Zona horaria
  notifications: {
    email: boolean,                 // Notificaciones por email
    push: boolean,                  // Notificaciones push
    sms: boolean                    // Notificaciones SMS
  }
}
```

**Gestión Administrativa (servicios disponibles):**

- ✅ `deactivateUser(userId)` - Desactivar cuenta (protege último super admin)
- ✅ `activateUser(userId)` - Reactivar cuenta desactivada
- ✅ `removeUser(userId)` - Soft delete de usuario (protege último super admin)

**Protección del Super Admin:**
El sistema previene automáticamente:

- ❌ Desactivación del último super admin activo
- ❌ Eliminación del último super admin activo
- ✅ Requiere crear otro super admin antes de realizar estas acciones

**Caché de Permisos:**

- Los permisos de usuario se cachean por 5 minutos (configurable)
- Invalidación automática al cambiar roles o permisos
- Caché separado para PermissionsGuard (optimización)

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

El sistema incluye health checks completos para todos los servicios críticos:

```bash
# Health check completo (todos los servicios)
GET /health
# Verifica: Database, Redis, Email/SMTP, Memory (heap/RSS), Disk

# Health checks individuales
GET /health/db       # Solo base de datos
GET /health/redis    # Solo Redis
GET /health/email    # Solo servicio de email
```

**Servicios monitoreados:**

- **Database**: Conexión PostgreSQL (timeout: 3s)
- **Redis**: Conexión y operaciones
- **SMTP**: Verificación de conexión de email
- **Memory Heap**: Alerta si > 300MB
- **Memory RSS**: Alerta si > 500MB
- **Disk**: Alerta si > 90% de uso

**Respuesta exitosa (HTTP 200):**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "smtp": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" }
  },
  "error": {},
  "details": { ... }
}
```

**Respuesta con fallas (HTTP 503):**

```json
{
  "status": "error",
  "error": {
    "redis": {
      "status": "down",
      "message": "Connection refused"
    }
  }
}
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
