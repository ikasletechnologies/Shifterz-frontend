const fs = require('fs');
const p = 'src/modules/job-card/components/ViewJobCardDialog.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('import { READY_FOR_BILLING_STATUSES }', 'import { usePermissions } from "@/lib/permissions";\nimport { READY_FOR_BILLING_STATUSES }');
fs.writeFileSync(p, c);
console.log('Import added to ViewJobCardDialog');
