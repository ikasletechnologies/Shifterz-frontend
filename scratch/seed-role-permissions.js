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

const DEFAULT_MATRIX = {
  SUPER_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance", "settings", "roles"],
  HQ_USER: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance", "settings"],
  FRANCHISE_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance"],
  BRANCH_MANAGER: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "attendance"],
  RECEPTION_EXECUTIVE: ["dashboard", "carin", "outpass", "customers", "leads", "attendance"],
  SERVICE_ADVISOR: ["dashboard", "carin", "jobs", "outpass", "customers", "leads", "attendance"],
  TECHNICIAN: ["dashboard", "jobs", "attendance"],
  QUALITY_INSPECTOR: ["dashboard", "jobs", "carin"],
  BILLING_EXECUTIVE: ["dashboard", "billing", "payments", "reports"],
  INVENTORY_EXECUTIVE: ["dashboard", "inventory", "reports"],
};

async function main() {
  for (const [role, permissions] of Object.entries(DEFAULT_MATRIX)) {
    const existing = await p.rolePermission.findUnique({ where: { role } });
    if (!existing) {
      await p.rolePermission.create({
        data: { role, permissions, actions: [] }
      });
      console.log(`Created default permissions for role: ${role}`);
    } else {
      console.log(`Role ${role} already exists with ${existing.permissions.length} permissions`);
    }
  }
  const all = await p.rolePermission.findMany();
  console.log("All roles in DB:", all.map(r => `${r.role}: [${r.permissions.join(', ')}]`));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
