"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = __importDefault(require("../services/AuthService"));
const extractErrorMessage = (error, fallback = 'Error desconocido') => {
    if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string') {
            return error.message;
        }
        if ('sqlMessage' in error && typeof error.sqlMessage === 'string') {
            return error.sqlMessage;
        }
    }
    return fallback;
};
const AuthController = {
    register: async (req, res) => {
        const { username, password, nombre, apellido, correo, telefono, celular, direccion, grabUserId } = req.body;
        if (typeof username !== 'string' ||
            typeof password !== 'string' ||
            typeof nombre !== 'string' ||
            typeof apellido !== 'string') {
            res.status(400).json({ message: 'username, password, nombre y apellido son obligatorios' });
            return;
        }
        try {
            const registerPayload = {
                username,
                password,
                nombre,
                apellido,
            };
            if (typeof correo === 'string')
                registerPayload.correo = correo;
            if (typeof telefono === 'string')
                registerPayload.telefono = telefono;
            if (typeof celular === 'string')
                registerPayload.celular = celular;
            if (typeof direccion === 'string')
                registerPayload.direccion = direccion;
            if (typeof grabUserId === 'number')
                registerPayload.grabUserId = grabUserId;
            const { user } = await AuthService_1.default.register(registerPayload);
            res.status(201).json({
                user,
                message: 'Usuario creado. Solicita a un administrador la habilitacion de tu acceso.',
            });
        }
        catch (error) {
            const message = extractErrorMessage(error);
            if (message.includes('ya se encuentra registrado')) {
                res.status(409).json({ message });
                return;
            }
            res.status(400).json({ message });
        }
    },
    login: async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ message: 'Usuario y contrasena son obligatorios' });
            return;
        }
        try {
            const result = await AuthService_1.default.login({ username, password });
            if (!result) {
                res.status(401).json({ message: 'Credenciales invalidas' });
                return;
            }
            res.json(result);
        }
        catch (error) {
            const message = extractErrorMessage(error);
            if (message === 'Usuario sin permisos de acceso') {
                res.status(403).json({ message });
                return;
            }
            res.status(500).json({ message });
        }
    },
    profile: async (req, res) => {
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
            const profile = await AuthService_1.default.getProfile(userId);
            if (!profile) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ message: extractErrorMessage(error) });
        }
    },
};
exports.default = AuthController;
//# sourceMappingURL=AuthController.js.map