import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from './auth';
import { logRequestEvent } from '../utils/logger';

export const requireRole = (allowedRoles: number[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const roleRaw = req.auth?.role ?? (req.auth as { rol?: unknown })?.rol;
    const role = typeof roleRaw === 'number' ? roleRaw : Number(roleRaw);

    if (!Number.isFinite(role) || !allowedRoles.includes(role)) {
      void logRequestEvent(req, {
        section: 'AUTORIZACION',
        statusCode: 403,
        message: 'Acceso denegado',
        detail: `Rol requerido: ${allowedRoles.join(', ')}`,
      });
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }

    next();
  };
};

export default requireRole;
