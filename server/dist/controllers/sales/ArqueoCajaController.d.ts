import type { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
declare const ArqueoCajaController: {
    list: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    available: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    create: (req: AuthenticatedRequest, res: Response) => Promise<void>;
};
export default ArqueoCajaController;
//# sourceMappingURL=ArqueoCajaController.d.ts.map