"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', routes_1.default);
app.get('/', (_req, res) => {
    res.json({ message: 'Servidor operativo' });
});
app.use((req, res) => {
    void (0, logger_1.logRequestEvent)(req, {
        section: 'ROUTING',
        statusCode: 404,
        message: 'Recurso no encontrado',
    });
    res.status(404).json({ message: 'Recurso no encontrado' });
});
app.use((error, req, res, _next) => {
    void (0, logger_1.logRequestEvent)(req, {
        section: 'ERROR',
        statusCode: 500,
        message: 'Error interno del servidor',
        detail: error.message,
    });
    res.status(500).json({ message: 'Error interno del servidor', detail: error.message });
});
exports.default = app;
//# sourceMappingURL=app.js.map