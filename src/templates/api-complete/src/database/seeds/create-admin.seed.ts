import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export async function createAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository('User');

  // Obtener credenciales del admin desde variables de entorno
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lacasoft.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'user444!@#';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'LACA-SOFT';

  // Verificar si ya existe un admin
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Usuario admin ya existe');
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
  });

  await userRepository.save(admin);

  console.log('✅ Usuario admin creado exitosamente:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}
