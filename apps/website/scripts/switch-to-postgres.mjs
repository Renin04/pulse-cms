/**
 * Switch from SQLite to PostgreSQL
 *
 * Usage:
 *   node scripts/switch-to-postgres.mjs
 *
 * This copies schema.postgresql.prisma to schema.prisma.
 * You must have a running PostgreSQL server and update .env
 * with your DATABASE_URL before running migrations.
 */

import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const prismaDir = resolve(process.cwd(), 'prisma');
const source = resolve(prismaDir, 'schema.postgresql.prisma');
const target = resolve(prismaDir, 'schema.prisma');

if (!existsSync(source)) {
  console.error('Error: schema.postgresql.prisma not found');
  process.exit(1);
}

copyFileSync(source, target);
console.log('✅ Switched Prisma schema to PostgreSQL');
console.log('');
console.log('Next steps:');
console.log('  1. Ensure PostgreSQL is running');
console.log('  2. Update .env DATABASE_URL to your PostgreSQL connection string');
console.log('  3. Run: npx prisma migrate dev');
console.log('  4. Run: npx prisma db seed');
console.log('  5. Restart the dev server');
