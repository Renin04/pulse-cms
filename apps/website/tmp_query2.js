const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ include: { userRoles: { include: { role: true } } } })
  .then(users => {
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log('ID:', u.id);
      console.log('Email:', u.email);
      console.log('Status:', u.status);
      console.log('Roles:', u.userRoles.map(ur => ur.role.name));
    });
  })
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma['\u0024disconnect']().then(() => process.exit()));
