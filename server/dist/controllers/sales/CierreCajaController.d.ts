import type { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
declare const CierreCajaController: {
    list: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    available: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    create: (req: AuthenticatedRequest, res: Response) => Promise<void>;
};
export default CierreCajaController;
//# sourceMappingURL=CierreCajaController.d.ts.map