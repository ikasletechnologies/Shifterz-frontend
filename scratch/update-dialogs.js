const fs = require('fs');
const path = require('path');

// 1. CustomerPage.tsx
const custPath = path.resolve(__dirname, '../src/modules/customer/page/CustomerPage.tsx');
let custCode = fs.readFileSync(custPath, 'utf8');

if (!custCode.includes('import { usePermissions } from "@/lib/permissions";')) {
  custCode = custCode.replace(
    'import { toast } from "react-hot-toast";',
    'import { toast } from "react-hot-toast";\nimport { usePermissions } from "@/lib/permissions";'
  );
  custCode = custCode.replace(
    'export function CustomerPage() {\n  const router = useRouter();',
    'export function CustomerPage() {\n  const router = useRouter();\n  const { canAccess } = usePermissions();'
  );
  custCode = custCode.replace(
    `<button\n                        onClick={() => handleOpenCheckIn(customer)}\n                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"\n                        title="Convert to Car Check-In"\n                      >\n                        <Car className="w-3.5 h-3.5" />\n                        <span>Convert to Check-In</span>\n                      </button>`,
    `{canAccess("carin") && (\n                        <button\n                          onClick={() => handleOpenCheckIn(customer)}\n                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"\n                          title="Convert to Car Check-In"\n                        >\n                          <Car className="w-3.5 h-3.5" />\n                          <span>Convert to Check-In</span>\n                        </button>\n                      )}`
  );
  fs.writeFileSync(custPath, custCode, 'utf8');
  console.log('Successfully updated CustomerPage.tsx');
}

// 2. ViewJobCardDialog.tsx
const jobPath = path.resolve(__dirname, '../src/modules/job-card/components/ViewJobCardDialog.tsx');
let jobCode = fs.readFileSync(jobPath, 'utf8');

if (!jobCode.includes('import { usePermissions } from "@/lib/permissions";')) {
  jobCode = jobCode.replace(
    'import { getJobQcInspections, getQcTemplateByStage } from "@/lib/api";',
    'import { getJobQcInspections, getQcTemplateByStage } from "@/lib/api";\nimport { usePermissions } from "@/lib/permissions";'
  );
  jobCode = jobCode.replace(
    'export default function ViewJobCardDialog({',
    'export default function ViewJobCardDialog({\n'
  );
  // find handleGoToBilling button
  jobCode = jobCode.replace(
    `<button\n                              type="button"\n                              onClick={handleGoToBilling}`,
    `{canAccess("billing") && (\n                            <button\n                              type="button"\n                              onClick={handleGoToBilling}`
  );
  jobCode = jobCode.replace(
    `Go to Billing\n                            </button>`,
    `Go to Billing\n                            </button>\n                            )}`
  );
  // add canAccess inside component
  jobCode = jobCode.replace(
    'const router = useRouter();',
    'const router = useRouter();\n  const { canAccess } = usePermissions();'
  );
  fs.writeFileSync(jobPath, jobCode, 'utf8');
  console.log('Successfully updated ViewJobCardDialog.tsx');
}
