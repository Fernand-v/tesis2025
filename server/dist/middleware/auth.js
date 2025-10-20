"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = require("../utils/logger");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    if (!token) {
        void (0, logger_1.logRequestEvent)(req, {
            section: 'AUTORIZACION',
            statusCode: 401,
            message: 'Token no proporcionado',
        });
        res.status(401).json({ message: 'Token no proporcionado' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.default.jwtSecret);
        if (typeof payload === 'string') {
            req.auth = { sub: payload };
        }
        else {
            req.auth = { ...payload };
        }
        next();
    }
    catch (error) {
        void (0, logger_1.logRequestEvent)(req, {
            section: 'AUTORIZACION',
            statusCode: 401,
            message: 'Token invalido',
            detail: error.message,
        });
        res.status(401).json({ message: 'Token invalido' });
    }
};
exports.authenticateToken = authenticateToken;
exports.default = exports.authenticateToken;
//# sourceMappingURL=auth.js.map