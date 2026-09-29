const fs = require('fs');

const routePath = 'd:/shifters/Shifterz-backend/src/modules/inventory/routes/inventory.routes.ts';
let routes = fs.readFileSync(routePath, 'utf8').replace(/\r\n/g, '\n');

// Import AuthRequest if needed
if (!routes.includes('AuthRequest')) {
  routes = routes.replace(
    "import { authenticate, requireRole, requirePermission } from '../../../middleware/auth.middleware.js';",
    "import { authenticate, requireRole, requirePermission, type AuthRequest } from '../../../middleware/auth.middleware.js';"
  );
}

// Cast req: AuthRequest
routes = routes.replace(
  "inventoryRouter.get('/', (req, res, next) => {",
  "inventoryRouter.get('/', (req: AuthRequest, res, next) => {"
);

fs.writeFileSync(routePath, routes, 'utf8');
console.log('Fixed inventory.routes.ts AuthRequest');
