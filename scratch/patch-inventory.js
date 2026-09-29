const fs = require('fs');

const routePath = 'd:/shifters/Shifterz-backend/src/modules/inventory/routes/inventory.routes.ts';
let routes = fs.readFileSync(routePath, 'utf8').replace(/\r\n/g, '\n');

const targetRoute = `inventoryRouter.use(requirePermission('inventory'));

// Standard Inventory Items CRUD
inventoryRouter.get('/', controller.getAllItems);`;

const newRoute = `// Allow users with inventory OR billing permissions to list items (properly scoped by franchise)
inventoryRouter.get('/', (req, res, next) => {
  if (req.user?.role === 'SUPER_ADMIN' || req.user?.permissions?.includes('inventory') || req.user?.permissions?.includes('billing')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Missing required permission (inventory or billing)' });
}, controller.getAllItems);

inventoryRouter.use(requirePermission('inventory'));`;

if (routes.includes(targetRoute)) {
  routes = routes.replace(targetRoute, newRoute);
  fs.writeFileSync(routePath, routes, 'utf8');
  console.log('inventory.routes.ts updated');
} else {
  console.log('targetRoute not found in inventory.routes.ts');
}

const servicePath = 'd:/shifters/Shifterz-backend/src/modules/inventory/service/inventory.service.ts';
let service = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

const targetService = `  async getAllItems(actor?: ScopeActor) {
    const scope = resolveDataScope(actor);
    return this.repository.findAll({ isDeleted: false, ...scopeWhere(scope) });
  }`;

const newService = `  async getAllItems(actor?: ScopeActor) {
    const scope = resolveDataScope(actor);
    if (scope.unrestricted) {
      return this.repository.findAll({ isDeleted: false });
    }
    if (!scope.franchiseId) {
      return [];
    }
    return this.repository.findAll({
      isDeleted: false,
      OR: [
        { franchiseId: scope.franchiseId },
        { franchiseId: null },
      ],
    });
  }`;

if (service.includes(targetService)) {
  service = service.replace(targetService, newService);
  fs.writeFileSync(servicePath, service, 'utf8');
  console.log('inventory.service.ts updated');
} else {
  console.log('targetService not found in inventory.service.ts');
}
