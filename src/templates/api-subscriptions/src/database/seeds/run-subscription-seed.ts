import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedPlans } from './plans.seed';
import { seedSystemConfig } from './system-config.seed';

// Cargar variables de entorno
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'suscriptions',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function runSeed() {
  try {
    console.log('🌱 Starting subscription seeding...\n');

    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✓ Database connection established\n');

    // Ejecutar seeders
    console.log('📦 Seeding plans...');
    await seedPlans(AppDataSource);

    console.log('\n⚙️  Seeding system configuration...');
    await seedSystemConfig(AppDataSource);

    console.log('\n✅ Subscription seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();
