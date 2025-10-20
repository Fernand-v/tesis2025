import { Router, type Request, type Response } from 'express';

import AuthController from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import catalogRoutes from './catalog';
import salesRoutes from './sales';
import adminRoutes from './admin';
import reportRoutes from './reports';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/profile', authenticateToken, AuthController.profile);
router.use('/catalog', authenticateToken, catalogRoutes);
router.use('/sales', authenticateToken, salesRoutes);
router.use('/admin', authenticateToken, adminRoutes);
router.use('/reports', authenticateToken, reportRoutes);

export default router;
