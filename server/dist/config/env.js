"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredVars.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Falta configurar la variable de entorno ${key}`);
    }
});
const jwtExpiresInHours = Number(process.env.JWT_EXPIRES_IN_HOURS);
const normalizedJwtHours = Number.isNaN(jwtExpiresInHours) || jwtExpiresInHours <= 0 ? 4 : jwtExpiresInHours;
const jwtExpiresInSeconds = Math.floor(normalizedJwtHours * 60 * 60);
const config = {
    port: Number(process.env.PORT) || 3000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: jwtExpiresInSeconds,
    database: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },
    reportService: {
        url: process.env.REPORT_SERVICE_URL ?? 'http://localhost:5555/report',
    },
};
exports.default = config;
//# sourceMappingURL=env.js.map