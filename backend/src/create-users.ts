import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Ensuring default users exist...');

  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'LogiFlow Admin',
      }
    });
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@logiflow.com' } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        company_id: company.id,
        email: 'admin@logiflow.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Created admin@logiflow.com');
  } else {
    // Update password just in case
    await prisma.user.update({
      where: { email: 'admin@logiflow.com' },
      data: { password: hashedPassword, role: 'SUPER_ADMIN' }
    });
    console.log('Updated admin@logiflow.com');
  }

  // Driver User
  const driverExists = await prisma.user.findUnique({ where: { email: 'driver@logiflow.com' } });
  if (!driverExists) {
    await prisma.user.create({
      data: {
        company_id: company.id,
        email: 'driver@logiflow.com',
        password: hashedPassword,
        first_name: 'Delivery',
        last_name: 'Driver',
        role: 'OPERATIONS',
      },
    });
    console.log('Created driver@logiflow.com');
  } else {
    await prisma.user.update({
      where: { email: 'driver@logiflow.com' },
      data: { password: hashedPassword, role: 'OPERATIONS' }
    });
    console.log('Updated driver@logiflow.com');
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
