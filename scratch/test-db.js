const fs = require('fs');
const path = require('path');
const envText = fs.readFileSync(path.resolve(__dirname, '../../Shifterz-backend/.env'), 'utf8');
const match = envText.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
const dbUrl = match[1];

const { PrismaClient } = require(path.resolve(__dirname, '../../Shifterz-backend/node_modules/@prisma/client'));
const { PrismaPg } = require(path.resolve(__dirname, '../../Shifterz-backend/node_modules/@prisma/adapter-pg'));
const pg = require(path.resolve(__dirname, '../../Shifterz-backend/node_modules/pg'));

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  const roles = await p.rolePermission.findMany();
  console.log("ROLE_PERMISSIONS IN DB:", JSON.stringify(roles, null, 2));
  const employees = await p.employee.findMany({
    select: { id: true, name: true, username: true, role: true, permission: true }
  });
  console.log("EMPLOYEES COUNT:", employees.length);
  console.log("EMPLOYEES:", JSON.stringify(employees, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
