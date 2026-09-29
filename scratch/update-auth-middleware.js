const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../Shifterz-backend/src/middleware/auth.middleware.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Ensure resolveUserPermissions is imported
content = content.replace(
  'import { resolveActionPermissions, ALL_ACTIONS } from "../lib/auth.js";',
  'import { resolveActionPermissions, ALL_ACTIONS, resolveUserPermissions } from "../lib/auth.js";'
);

// 2. Update requirePermission implementation
const oldRequirePerm = `export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }
    
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: \`Forbidden: Missing permission \${permission}\` });
    }
    
    next();
  };
};`;

const newRequirePerm = `export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    try {
      const effectivePermissions = await resolveUserPermissions(req.user.id, req.user.role);
      if (!effectivePermissions || !effectivePermissions.includes(permission)) {
        return res.status(403).json({ error: \`Forbidden: Missing permission \${permission}\` });
      }
      next();
    } catch (err) {
      return res.status(403).json({ error: \`Forbidden: Unable to verify permission \${permission}\` });
    }
  };
};`;

if (!content.includes(newRequirePerm)) {
  content = content.replace(oldRequirePerm, newRequirePerm);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully updated requirePermission in auth.middleware.ts');
} else {
  console.log('auth.middleware.ts already updated');
}
