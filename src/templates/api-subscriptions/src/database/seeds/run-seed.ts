import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { seedRolesAndPermissions } from './roles-permissions.seed';
import { createAdminUser } from './create-admin.seed';
import { seedCurrencies } from './currencies.seed';
import { seedPlans } from './plans.seed';
import { seedSystemConfig } from './system-config.seed';
import { seedAccounts } from './accounts.seed';

// Cargar variables de entorno
config();

const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE as any) || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'nestjs_db',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function runSeeds() {
  try {
    console.log('🌱 Iniciando seeders...');
    console.log('');

    await AppDataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');
    console.log('');

    // Run seeders in order
    console.log('📋 Ejecutando seeders en orden...');
    console.log('');

    await seedRolesAndPermissions(AppDataSource);
    await createAdminUser(AppDataSource);
    await seedCurrencies(AppDataSource);
    await seedPlans(AppDataSource);
    await seedSystemConfig(AppDataSource);
    await seedAccounts(AppDataSource);

    console.log('');
    await AppDataSource.destroy();
    console.log('✅ Todos los seeders completados exitosamente');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error ejecutando seeders:', error);
    console.error('');
    process.exit(1);
  }
}

runSeeds();
