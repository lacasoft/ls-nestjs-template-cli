import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../modules/users/entities/user.entity';
import { Role, RoleType } from '../../modules/roles/entities/role.entity';

export async function createAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  // Obtener credenciales del admin desde variables de entorno
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lacasoft.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'user444!@#';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'LACA-SOFT';

  // Verificar si ya existe un admin
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
    relations: ['roles'],
  });

  // Get super_admin role
  const superAdminRole = await roleRepository.findOne({
    where: { name: RoleType.SUPER_ADMIN },
  });

  if (!superAdminRole) {
    console.log('⚠️  Super admin role not found. Please run roles-permissions seed first.');
    return;
  }

  if (existingAdmin) {
    // Assign super_admin role if not already assigned
    if (!existingAdmin.roles?.some((r) => r.name === RoleType.SUPER_ADMIN)) {
      existingAdmin.roles = [...(existingAdmin.roles || []), superAdminRole];
      await userRepository.save(existingAdmin);
      console.log('✅ Super admin role assigned to existing user');
    } else {
      console.log('✅ Usuario admin ya existe con rol super_admin');
    }
    return;
  }

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = userRepository.create({
    email: adminEmail,
    password: hashedPassword,
    firstName: adminFirstName,
    lastName: adminLastName,
    isActive: true,
    roles: [superAdminRole],
  });

  await userRepository.save(admin);

  console.log('✅ Usuario admin creado exitosamente:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: ${RoleType.SUPER_ADMIN}`);
}
