import { DataSource } from 'typeorm';
import { Account } from '../../modules/accounts/entities/account.entity';
import { User } from '../../modules/users/entities/user.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../modules/subscriptions/entities/subscription.entity';
import { Plan } from '../../modules/plans/entities/plan.entity';

export async function seedAccounts(dataSource: DataSource): Promise<void> {
  const accountRepository = dataSource.getRepository(Account);
  const userRepository = dataSource.getRepository(User);
  const subscriptionRepository = dataSource.getRepository(Subscription);
  const planRepository = dataSource.getRepository(Plan);

  // Verificar si ya existen cuentas
  const existingAccounts = await accountRepository.count();
  if (existingAccounts > 0) {
    console.log('✓ Accounts already seeded, skipping...');
    return;
  }

  // Obtener el plan Free
  const freePlan = await planRepository.findOne({ where: { code: 'PLAN_FREE' } });
  if (!freePlan) {
    console.log('⚠ Warning: Free plan not found. Run plans seed first.');
    return;
  }

  // Crear cuenta de prueba
  const testAccountData = {
    name: 'Test Company',
    slug: 'test-company',
    description: 'Account de prueba para desarrollo',
    isActive: true,
    settings: {
      timezone: 'America/Mexico_City',
      currency: 'MXN',
      language: 'es',
    },
  };

  const testAccount = await accountRepository.save(accountRepository.create(testAccountData));
  console.log(`✓ Created test account: ${testAccount.name}`);

  // Buscar usuarios sin cuenta y asignarles la cuenta de prueba
  const usersWithoutAccount = await userRepository.find({
    where: { accountId: null as any },
  });

  if (usersWithoutAccount.length > 0) {
    for (const user of usersWithoutAccount) {
      user.accountId = testAccount.id;
      user.isAccountOwner = true;
    }
    await userRepository.save(usersWithoutAccount);
    console.log(`✓ Assigned ${usersWithoutAccount.length} users to test account`);
  }

  // Crear suscripción para la cuenta de prueba
  const now = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días de trial

  const subscriptionData = {
    accountId: testAccount.id,
    planId: freePlan.id,
    status: SubscriptionStatus.TRIAL,
    trialStartsAt: now,
    trialEndsAt: trialEndsAt,
    nextBillingDate: trialEndsAt,
    currentPrice: freePlan.price,
    autoRenew: true,
    metadata: {
      source: 'seed',
      createdBy: 'system',
    },
  };

  await subscriptionRepository.save(subscriptionRepository.create(subscriptionData));
  console.log(`✓ Created trial subscription for test account`);

  console.log('✓ Successfully seeded accounts and subscriptions');
}
