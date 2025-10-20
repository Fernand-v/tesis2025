import { Request, Response, NextFunction } from 'express';
import jwt, { type Secret } from 'jsonwebtoken';

import config from '../config/env';
import { logRequestEvent } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  auth?: jwt.JwtPayload & {
    sub?: string | number | undefined;
    username?: string | undefined;
    role?: number | undefined;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  if (!token) {
    void logRequestEvent(req, {
      section: 'AUTORIZACION',
      statusCode: 401,
      message: 'Token no proporcionado',
    });
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret as Secret);
    if (typeof payload === 'string') {
      req.auth = { sub: payload };
    } else {
      req.auth = { ...payload };
    }
    next();
  } catch (error) {
    void logRequestEvent(req, {
      section: 'AUTORIZACION',
      statusCode: 401,
      message: 'Token invalido',
      detail: (error as Error).message,
    });
    res.status(401).json({ message: 'Token invalido' });
  }
};

export default authenticateToken;
