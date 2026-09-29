const fs = require('fs');
const path = require('path');

const updates = [
  {
    file: '../../Shifterz-backend/src/modules/vehicle-checkin/routes/vehicle-checkin.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireRole } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireRole, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("vehicleCheckinRouter.use(requirePermission('carin'));")) {
        res = res.replace(
          "vehicleCheckinRouter.use(authenticate);",
          "vehicleCheckinRouter.use(authenticate);\nvehicleCheckinRouter.use(requirePermission('carin'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/job-card/routes/job-card.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("jobCardRouter.use(requirePermission('jobs'));")) {
        res = res.replace(
          "jobCardRouter.use(authenticate);",
          "jobCardRouter.use(authenticate);\njobCardRouter.use(requirePermission('jobs'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/billing/routes/billing.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireRole, requireAction } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireRole, requireAction, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("billingRouter.use(requirePermission('billing'));")) {
        res = res.replace(
          "billingRouter.use(authenticate);",
          "billingRouter.use(authenticate);\nbillingRouter.use(requirePermission('billing'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/payments/routes/payments.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireAction } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireAction, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("paymentsRouter.use(requirePermission('payments'));")) {
        res = res.replace(
          "paymentsRouter.use(authenticate);",
          "paymentsRouter.use(authenticate);\npaymentsRouter.use(requirePermission('payments'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/outpass/routes/outpass.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireAction } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireAction, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("outpassRouter.use(requirePermission('outpass'));")) {
        res = res.replace(
          "outpassRouter.use(authenticate);",
          "outpassRouter.use(authenticate);\noutpassRouter.use(requirePermission('outpass'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/inventory/routes/inventory.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireRole } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireRole, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("inventoryRouter.use(requirePermission('inventory'));")) {
        res = res.replace(
          "inventoryRouter.use(authenticate);",
          "inventoryRouter.use(authenticate);\ninventoryRouter.use(requirePermission('inventory'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/customer/routes/customer.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireAction } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireAction, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("customerRouter.use(requirePermission('customers'));")) {
        res = res.replace(
          "customerRouter.use(authenticate);",
          "customerRouter.use(authenticate);\ncustomerRouter.use(requirePermission('customers'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/lead/routes/lead.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireAction, type AuthRequest } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireAction, requirePermission, type AuthRequest } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("leadRouter.use(requirePermission('leads'));")) {
        res = res.replace(
          "leadRouter.use(authenticate);",
          "leadRouter.use(authenticate);\nleadRouter.use(requirePermission('leads'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/qc/qc.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireAction } from '../../middleware/auth.middleware.js';",
        "import { authenticate, requireAction, requirePermission } from '../../middleware/auth.middleware.js';"
      );
      if (!res.includes("qcRouter.use(requirePermission('jobs'));")) {
        res = res.replace(
          "qcRouter.use(authenticate);",
          "qcRouter.use(authenticate);\nqcRouter.use(requirePermission('jobs'));"
        );
      }
      return res;
    }
  },
  {
    file: '../../Shifterz-backend/src/modules/employee/routes/attendance.routes.ts',
    transform: (code) => {
      let res = code.replace(
        "import { authenticate, requireAction } from '../../../middleware/auth.middleware.js';",
        "import { authenticate, requireAction, requirePermission } from '../../../middleware/auth.middleware.js';"
      );
      if (!res.includes("attendanceRouter.use(requirePermission('attendance'));")) {
        res = res.replace(
          "attendanceRouter.use(authenticate);",
          "attendanceRouter.use(authenticate);\nattendanceRouter.use(requirePermission('attendance'));"
        );
      }
      return res;
    }
  },
];

for (const item of updates) {
  const filePath = path.resolve(__dirname, item.file);
  const code = fs.readFileSync(filePath, 'utf8');
  const transformed = item.transform(code);
  fs.writeFileSync(filePath, transformed, 'utf8');
  console.log(`Updated ${path.basename(filePath)}`);
}
