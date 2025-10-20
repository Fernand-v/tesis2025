"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const logger_1 = require("../utils/logger");
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const roleRaw = req.auth?.role ?? req.auth?.rol;
        const role = typeof roleRaw === 'number' ? roleRaw : Number(roleRaw);
        if (!Number.isFinite(role) || !allowedRoles.includes(role)) {
            void (0, logger_1.logRequestEvent)(req, {
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
exports.requireRole = requireRole;
exports.default = exports.requireRole;
//# sourceMappingURL=roles.js.map