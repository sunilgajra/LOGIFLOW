import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = `${process.env.DIRECT_URL || process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create a Company
  const company = await prisma.company.create({
    data: {
      name: 'ABC Logistics Pvt Ltd',
      address: '123 Logistics Park, Mumbai',
      currency: 'INR',
    },
  });

  console.log(`Created Company: ${company.name}`);

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
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
  console.log('Created Admin User (admin@logiflow.com / password123)');

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
  console.log('Created Driver User (driver@logiflow.com / password123)');

  // 3. Create Clients
  const client1 = await prisma.client.create({
    data: {
      company_id: company.id,
      client_id: 'CLI-001',
      company_name: 'ABC Enterprises',
      contact_person: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@abcenterprises.com',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      company_id: company.id,
      client_id: 'CLI-002',
      company_name: 'XYZ Pharma',
      contact_person: 'Priya Patel',
      phone: '9876543211',
      email: 'priya@xyzpharma.com',
    },
  });

  console.log('Created Clients');

  // 4. Create Couriers
  const courier1 = await prisma.courierPartner.create({
    data: {
      company_id: company.id,
      courier_id: 'COUR-BLUEDART',
      courier_name: 'Blue Dart',
    },
  });

  const courier2 = await prisma.courierPartner.create({
    data: {
      company_id: company.id,
      courier_id: 'COUR-DELHIVERY',
      courier_name: 'Delhivery',
    },
  });

  console.log('Created Couriers');

  // 5. Create Shipments
  const statuses = ['DELIVERED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RTO', 'PENDING'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'];
  
  const shipments = [];
  
  for (let i = 1; i <= 50; i++) {
    const awb = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const isClient1 = i % 2 === 0;
    const isCourier1 = i % 3 === 0;

    shipments.push({
      company_id: company.id,
      awb_number: awb,
      client_id: isClient1 ? client1.id : client2.id,
      courier_id: isCourier1 ? courier1.id : courier2.id,
      internal_status: status,
      receiver_name: `Customer ${i}`,
      receiver_phone: `99999999${i < 10 ? '0' + i : i}`,
      city: city,
      pincode: `4000${i < 10 ? '0' + i : i}`,
      actual_weight: Math.floor(Math.random() * 50) / 10 + 0.5,
      client_charge: Math.floor(Math.random() * 500) + 100,
      courier_cost: Math.floor(Math.random() * 400) + 50,
      booking_date: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000),
    });
  }

  await prisma.shipment.createMany({
    data: shipments,
  });

  console.log(`Created ${shipments.length} Sample Shipments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
