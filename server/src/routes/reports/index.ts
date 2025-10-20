import { Router } from 'express';

import ReportController from '../../controllers/report/ReportController';

const router = Router();

router.post('/', ReportController.generate);

export default router;
