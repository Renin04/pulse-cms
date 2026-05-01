import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const count = await prisma.entry.count();
const entries = await prisma.entry.findMany({ take: 5, select: { id: true, title: true, status: true, updatedAt: true } });
console.log('Total entries:', count);
console.log('Recent:', JSON.stringify(entries, null, 2));

await prisma.$disconnect();
