# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Stage 3: Runner (Producción)
FROM node:18-alpine AS runner
WORKDIR /app

# Crear usuario no privilegiado
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copiar dependencias de producción desde stage deps
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar código compilado desde stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT={{port}}

# Exponer puerto
EXPOSE {{port}}

# Cambiar a usuario no privilegiado
USER nestjs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{port}}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/main"]
