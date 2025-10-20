import type { Request, Response } from 'express';

import AuthService, { RegisterPayload } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/auth';

const extractErrorMessage = (error: unknown, fallback = 'Error desconocido'): string => {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }

    if ('sqlMessage' in error && typeof (error as { sqlMessage?: unknown }).sqlMessage === 'string') {
      return (error as { sqlMessage: string }).sqlMessage;
    }
  }

  return fallback;
};

const AuthController = {
  register: async (req: Request, res: Response) => {
    const { username, password, nombre, apellido, correo, telefono, celular, direccion, grabUserId } =
      req.body as Record<string, unknown>;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof nombre !== 'string' ||
      typeof apellido !== 'string'
    ) {
      res.status(400).json({ message: 'username, password, nombre y apellido son obligatorios' });
      return;
    }

    try {
      const registerPayload: RegisterPayload = {
        username,
        password,
        nombre,
        apellido,
      };

      if (typeof correo === 'string') registerPayload.correo = correo;
      if (typeof telefono === 'string') registerPayload.telefono = telefono;
      if (typeof celular === 'string') registerPayload.celular = celular;
      if (typeof direccion === 'string') registerPayload.direccion = direccion;
      if (typeof grabUserId === 'number') registerPayload.grabUserId = grabUserId;

      const { user } = await AuthService.register(registerPayload);

      res.status(201).json({
        user,
        message: 'Usuario creado. Solicita a un administrador la habilitacion de tu acceso.',
      });
    } catch (error) {
      const message = extractErrorMessage(error);

      if (message.includes('ya se encuentra registrado')) {
        res.status(409).json({ message });
        return;
      }

      res.status(400).json({ message });
    }
  },

  login: async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ message: 'Usuario y contrasena son obligatorios' });
      return;
    }

    try {
      const result = await AuthService.login({ username, password });

      if (!result) {
        res.status(401).json({ message: 'Credenciales invalidas' });
        return;
      }

      res.json(result);
    } catch (error) {
      const message = extractErrorMessage(error);

      if (message === 'Usuario sin permisos de acceso') {
        res.status(403).json({ message });
        return;
      }

      res.status(500).json({ message });
    }
  },

  profile: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const userId = Number(req.auth.sub);

    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Token invalido' });
      return;
    }

    try {
      const profile = await AuthService.getProfile(userId);

      if (!profile) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: extractErrorMessage(error) });
    }
  },
};

export default AuthController;
