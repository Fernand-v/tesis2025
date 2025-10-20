import type { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
declare const AperturaCajaController: {
    list: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    create: (req: AuthenticatedRequest, res: Response) => Promise<void>;
};
export default AperturaCajaController;
//# sourceMappingURL=AperturaCajaController.d.ts.map