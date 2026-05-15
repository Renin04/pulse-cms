import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const cts = await prisma.contentType.findMany();
console.log(JSON.stringify(cts, null, 2));
await prisma.$disconnect();
