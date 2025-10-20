import type { Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth';
import BackupService from '../../services/admin/BackupService';
import { logRequestEvent } from '../../utils/logger';

const BackupController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { filePath, filename } = await BackupService.createDatabaseDump();

      res.download(filePath, filename, async (error) => {
        await BackupService.cleanup(filePath);
        if (error) {
          void logRequestEvent(req, {
            section: 'BACKUP',
            statusCode: 500,
            message: 'Fallo al entregar el backup',
            detail: error.message,
          });
        } else {
          void logRequestEvent(req, {
            section: 'BACKUP',
            statusCode: 200,
            message: 'Backup generado correctamente',
          });
        }
      });
    } catch (error) {
      const detail = (error as Error).message ?? 'Error desconocido';
      void logRequestEvent(req, {
        section: 'BACKUP',
        statusCode: 500,
        message: 'No se pudo generar el backup',
        detail,
      });
      res.status(500).json({ message: 'No se pudo generar el backup', detail });
    }
  },
};

export default BackupController;
