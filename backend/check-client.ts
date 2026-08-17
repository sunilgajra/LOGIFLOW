import { prisma } from './src/prisma';

async function check() {
  try {
    const clients = await prisma.client.findMany();
    console.log("All clients:", clients.map(c => ({ id: c.id, company_name: c.company_name, company_id: c.company_id })));
    
    const client = await prisma.client.findUnique({ where: { id: 'f6ffb094-539e-4e80-ae66-6b9b7e0351ff' } });
    console.log("Found client?", !!client);
    if (client) {
        console.log(client);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
