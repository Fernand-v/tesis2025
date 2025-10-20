import { Router } from 'express';

import BackupController from '../../controllers/admin/BackupController';
import { requireRole } from '../../middleware/roles';

const router = Router();

router.post('/backup/database', requireRole([1]), BackupController.create);

export default router;
