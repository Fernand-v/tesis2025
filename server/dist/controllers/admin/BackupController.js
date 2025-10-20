"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BackupService_1 = __importDefault(require("../../services/admin/BackupService"));
const logger_1 = require("../../utils/logger");
const BackupController = {
    create: async (req, res) => {
        try {
            const { filePath, filename } = await BackupService_1.default.createDatabaseDump();
            res.download(filePath, filename, async (error) => {
                await BackupService_1.default.cleanup(filePath);
                if (error) {
                    void (0, logger_1.logRequestEvent)(req, {
                        section: 'BACKUP',
                        statusCode: 500,
                        message: 'Fallo al entregar el backup',
                        detail: error.message,
                    });
                }
                else {
                    void (0, logger_1.logRequestEvent)(req, {
                        section: 'BACKUP',
                        statusCode: 200,
                        message: 'Backup generado correctamente',
                    });
                }
            });
        }
        catch (error) {
            const detail = error.message ?? 'Error desconocido';
            void (0, logger_1.logRequestEvent)(req, {
                section: 'BACKUP',
                statusCode: 500,
                message: 'No se pudo generar el backup',
                detail,
            });
            res.status(500).json({ message: 'No se pudo generar el backup', detail });
        }
    },
};
exports.default = BackupController;
//# sourceMappingURL=BackupController.js.map