const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(c => console.log('User count:', c))
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma['\u0024disconnect']().then(() => process.exit()));
