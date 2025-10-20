"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("../../config/env"));
const logger_1 = require("../../utils/logger");
const buildFormParams = (payload) => {
    const reportBaseName = payload.nombreReporte ?? payload.reporte;
    if (!reportBaseName || typeof reportBaseName !== 'string') {
        throw new Error('Falta el nombre del reporte');
    }
    const nombreArchivo = reportBaseName.endsWith('.jasper') ? reportBaseName : `${reportBaseName}.jasper`;
    const params = new URLSearchParams();
    params.append('reporte', nombreArchivo);
    if (payload.parametros && typeof payload.parametros === 'object') {
        Object.entries(payload.parametros).forEach(([key, value]) => {
            if (value === null || typeof value === 'undefined') {
                return;
            }
            params.append(key, String(value));
        });
    }
    if (typeof payload.paramString === 'string' && payload.paramString.trim() !== '') {
        const extras = new URLSearchParams(payload.paramString);
        extras.forEach((value, key) => {
            if (key !== 'reporte') {
                params.append(key, value);
            }
        });
    }
    return params;
};
const ReportController = {
    generate: async (req, res) => {
        try {
            const payload = (req.body ?? {});
            const params = buildFormParams(payload);
            const reportResponse = await fetch(env_1.default.reportService.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            if (!reportResponse.ok) {
                const errorText = await reportResponse.text().catch(() => '');
                void (0, logger_1.logRequestEvent)(req, {
                    section: 'REPORT',
                    statusCode: reportResponse.status,
                    message: 'Generacion de reporte fallida',
                    detail: errorText,
                    priority: 3,
                });
                res.status(500).json({ message: 'No se pudo generar el reporte' });
                return;
            }
            const arrayBuffer = await reportResponse.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);
            const fileName = (params.get('reporte') ?? 'reporte.jasper').replace(/\.jasper$/i, '.pdf');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            res.send(pdfBuffer);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo generar el reporte';
            void (0, logger_1.logRequestEvent)(req, {
                section: 'REPORT',
                statusCode: 500,
                message,
                detail: message,
                priority: 3,
            });
            res.status(500).json({ message });
        }
    },
};
exports.default = ReportController;
//# sourceMappingURL=ReportController.js.map