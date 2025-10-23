import { DataSource } from 'typeorm';
import { SystemConfig } from '../../modules/system-config/entities/system-config.entity';

export async function seedSystemConfig(dataSource: DataSource): Promise<void> {
  const configRepository = dataSource.getRepository(SystemConfig);

  // Verificar si ya existe configuración
  const existingConfig = await configRepository.count();
  if (existingConfig > 0) {
    console.log('✓ System config already seeded, skipping...');
    return;
  }

  const configs = [
    {
      key: 'default_currency',
      value: 'MXN',
      type: 'string',
      description: 'Moneda por defecto del sistema',
      isPublic: true,
    },
    {
      key: 'trial_days_default',
      value: '14',
      type: 'number',
      description: 'Días de prueba gratuita por defecto',
      isPublic: true,
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      description: 'Modo de mantenimiento del sistema',
      isPublic: true,
    },
    {
      key: 'max_failed_login_attempts',
      value: '5',
      type: 'number',
      description: 'Máximo de intentos fallidos de login antes de bloquear cuenta',
      isPublic: false,
    },
    {
      key: 'session_timeout_minutes',
      value: '60',
      type: 'number',
      description: 'Tiempo de expiración de sesión en minutos',
      isPublic: false,
    },
    {
      key: 'password_min_length',
      value: '8',
      type: 'number',
      description: 'Longitud mínima de contraseña',
      isPublic: true,
    },
    {
      key: 'enable_email_notifications',
      value: 'true',
      type: 'boolean',
      description: 'Habilitar notificaciones por email',
      isPublic: false,
    },
    {
      key: 'enable_push_notifications',
      value: 'true',
      type: 'boolean',
      description: 'Habilitar notificaciones push',
      isPublic: false,
    },
    {
      key: 'payment_reminder_days_before',
      value: '7',
      type: 'number',
      description: 'Días antes del pago para enviar recordatorio',
      isPublic: false,
    },
    {
      key: 'subscription_grace_period_days',
      value: '3',
      type: 'number',
      description: 'Días de gracia después de vencimiento de suscripción',
      isPublic: false,
    },
    {
      key: 'max_locations_per_account',
      value: '100',
      type: 'number',
      description: 'Máximo de ubicaciones por cuenta (para planes ilimitados)',
      isPublic: false,
    },
    {
      key: 'max_users_per_account',
      value: '500',
      type: 'number',
      description: 'Máximo de usuarios por cuenta (para planes ilimitados)',
      isPublic: false,
    },
    {
      key: 'invoice_number_prefix',
      value: 'INV',
      type: 'string',
      description: 'Prefijo para números de factura',
      isPublic: false,
    },
    {
      key: 'company_name',
      value: 'LACA-SOFT',
      type: 'string',
      description: 'Nombre de la empresa',
      isPublic: true,
    },
    {
      key: 'support_email',
      value: 'support@lacasoft.com',
      type: 'string',
      description: 'Email de soporte',
      isPublic: true,
    },
    {
      key: 'billing_email',
      value: 'billing@lacasoft.com',
      type: 'string',
      description: 'Email de facturación',
      isPublic: true,
    },
  ];

  // Crear configuraciones
  const createdConfigs = configRepository.create(configs);
  await configRepository.save(createdConfigs);

  console.log(`✓ Successfully seeded ${createdConfigs.length} system configurations`);
}
