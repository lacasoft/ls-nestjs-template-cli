import { DataSource } from 'typeorm';
import { Plan, PlanInterval, PlanStatus } from '../../modules/plans/entities/plan.entity';

export async function seedPlans(dataSource: DataSource): Promise<void> {
  const planRepository = dataSource.getRepository(Plan);

  // Verificar si ya existen planes
  const existingPlans = await planRepository.count();
  if (existingPlans > 0) {
    console.log('✓ Plans already seeded, skipping...');
    return;
  }

  const plans = [
    {
      name: 'Free',
      code: 'PLAN_FREE',
      description: 'Plan gratuito con funcionalidades básicas',
      price: 0,
      currency: 'MXN',
      prices: {
        MXN: 0,
        USD: 0,
        EUR: 0,
      },
      interval: PlanInterval.MONTHLY,
      intervalCount: 1,
      trialDays: 0,
      maxUsers: 1,
      maxLocations: 1,
      features: [
        'dashboard_basico',
        'reportes_limitados',
        'soporte_email',
        '1_usuario',
        '1_ubicacion',
      ],
      status: PlanStatus.ACTIVE,
      sortOrder: 1,
    },
    {
      name: 'Basic',
      code: 'PLAN_BASIC',
      description: 'Plan básico para pequeñas empresas',
      price: 174.83,
      currency: 'MXN',
      prices: {
        MXN: 174.83,
        USD: 9.99,
        EUR: 9.19,
      },
      interval: PlanInterval.MONTHLY,
      intervalCount: 1,
      trialDays: 14,
      maxUsers: 5,
      maxLocations: 3,
      features: [
        'dashboard_completo',
        'reportes_estandar',
        'soporte_email',
        'soporte_chat',
        '5_usuarios',
        '3_ubicaciones',
        'notificaciones_email',
        'exportar_datos_csv',
      ],
      status: PlanStatus.ACTIVE,
      sortOrder: 2,
    },
    {
      name: 'Pro',
      code: 'PLAN_PRO',
      description: 'Plan profesional para empresas en crecimiento',
      price: 524.83,
      currency: 'MXN',
      prices: {
        MXN: 524.83,
        USD: 29.99,
        EUR: 27.59,
      },
      interval: PlanInterval.MONTHLY,
      intervalCount: 1,
      trialDays: 14,
      maxUsers: 20,
      maxLocations: 10,
      features: [
        'dashboard_avanzado',
        'reportes_personalizados',
        'analytics_avanzado',
        'soporte_prioritario',
        '20_usuarios',
        '10_ubicaciones',
        'notificaciones_push',
        'exportar_datos_excel_pdf',
        'api_access',
        'integraciones_terceros',
        'webhooks',
      ],
      status: PlanStatus.ACTIVE,
      sortOrder: 3,
    },
    {
      name: 'Enterprise',
      code: 'PLAN_ENTERPRISE',
      description: 'Plan empresarial con todas las funcionalidades',
      price: 1749.83,
      currency: 'MXN',
      prices: {
        MXN: 1749.83,
        USD: 99.99,
        EUR: 91.99,
      },
      interval: PlanInterval.MONTHLY,
      intervalCount: 1,
      trialDays: 30,
      maxUsers: -1, // Ilimitado
      maxLocations: -1, // Ilimitado
      features: [
        'todo_del_plan_pro',
        'usuarios_ilimitados',
        'ubicaciones_ilimitadas',
        'soporte_dedicado_24_7',
        'account_manager',
        'sla_garantizado',
        'capacitacion_personalizada',
        'white_label',
        'implementacion_personalizada',
        'backup_diario',
        'auditoria_completa',
        'seguridad_avanzada',
      ],
      status: PlanStatus.ACTIVE,
      sortOrder: 4,
    },
  ];

  // Crear planes
  const createdPlans = planRepository.create(plans);
  await planRepository.save(createdPlans);

  console.log(`✓ Successfully seeded ${createdPlans.length} plans`);
}
