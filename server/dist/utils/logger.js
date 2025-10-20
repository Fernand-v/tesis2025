"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRequestEvent = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const pool_1 = __importDefault(require("../database/pool"));
const BASE_LOG_DIR = process.env.LOGS_DIR && process.env.LOGS_DIR.trim() !== ''
    ? path_1.default.resolve(process.env.LOGS_DIR)
    : path_1.default.resolve(process.cwd(), 'logs');
const pad = (value) => value.toString().padStart(2, '0');
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
};
const formatTimestamp = (date) => {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${formatDate(date)} ${hours}:${minutes}:${seconds}`;
};
const ensureDirectory = async (dir) => {
    await fs_1.promises.mkdir(dir, { recursive: true });
};
// ✅ Función mejorada para obtener la IP real del dispositivo cliente
const getClientIp = (req) => {
    let ip;
    // Aseguramos acceso seguro a headers
    const xForwardedFor = req.headers?.['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
        const first = xForwardedFor.split(',')[0];
        ip = first && first.trim() !== '' ? first.trim() : undefined; // primera IP real (segura)
    }
    else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
        const first = xForwardedFor[0];
        ip = typeof first === 'string' && first.trim() !== '' ? first.trim() : undefined;
    }
    // req.socket podría ser undefined en ciertos contextos
    if (!ip && req.socket && typeof req.socket.remoteAddress === 'string') {
        ip = req.socket.remoteAddress;
    }
    else if (!ip && typeof req.ip === 'string') {
        ip = req.ip;
    }
    // Limpieza de formatos IPv6 tipo ::ffff:192.168.0.1
    if (ip?.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    // Traducción de localhost IPv6
    if (ip === '::1') {
        ip = '127.0.0.1';
    }
    return ip ?? '-';
};
const writeLog = async (entry) => {
    const timestamp = entry.timestamp ?? new Date();
    const dateFolder = path_1.default.join(BASE_LOG_DIR, formatDate(timestamp));
    await ensureDirectory(dateFolder);
    const normalizedPriority = typeof entry.priority === 'number' && Number.isFinite(entry.priority)
        ? entry.priority
        : entry.statusCode >= 500
            ? 3
            : entry.statusCode >= 400
                ? 2
                : 1;
    if (typeof process.env.LOGS_DB_DISABLED === 'undefined' || process.env.LOGS_DB_DISABLED !== '1') {
        try {
            const pool = (0, pool_1.default)();
            const values = [
                entry.userId ?? null,
                entry.username ?? null,
                entry.url ?? null,
                normalizedPriority,
                entry.ip ?? null,
                timestamp,
                entry.detail ?? null,
                entry.message,
                entry.statusCode,
                entry.program ?? null,
            ];
            await pool.query(`
          INSERT INTO gen_logs (
            log_user,
            log_username,
            log_ruta,
            log_prioridad,
            log_ip,
            log_fecha_hora,
            log_respuesta,
            log_mensaje,
            log_codigo_estado,
            log_programa
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, values);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error('No se pudo guardar el log en la base de datos:', error.message);
        }
    }
    try {
        const filePath = path_1.default.join(dateFolder, 'api.log');
        const contentLines = [
            `SECCION: ${entry.section}`,
            `MOMENTO: ${formatTimestamp(timestamp)}`,
            `IP: ${entry.ip ?? '-'}`,
            `METODO: ${entry.method ?? '-'}`,
            `ENDPOINT: ${entry.url ?? '-'}`,
            `ESTADO: ${entry.statusCode}`,
            `RESPUESTA: ${entry.message}`,
        ];
        if (entry.detail) {
            contentLines.push(`DETALLE: ${entry.detail}`);
        }
        contentLines.push('----');
        await fs_1.promises.appendFile(filePath, `${contentLines.join('\n')}\n`, 'utf8');
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('No se pudo escribir el log de API:', error.message);
    }
};
const logRequestEvent = async (req, data) => {
    const ipString = getClientIp(req); // ✅ usa la nueva función
    const logEntry = {
        section: data.section,
        statusCode: data.statusCode,
        message: data.message,
        ip: ipString,
        method: req.method,
        url: req.originalUrl ?? req.url,
        username: req.auth?.username ?? null,
        userId: (() => {
            const sub = req.auth?.sub;
            if (typeof sub === 'number') {
                return sub;
            }
            const parsed = Number(sub);
            return Number.isFinite(parsed) ? parsed : null;
        })(),
        priority: typeof data.priority === 'number' ? data.priority : undefined,
        program: data.program ?? null,
    };
    if (typeof data.detail === 'string' && data.detail.trim() !== '') {
        logEntry.detail = data.detail;
    }
    await writeLog(logEntry);
};
exports.logRequestEvent = logRequestEvent;
exports.default = writeLog;
//# sourceMappingURL=logger.js.map