import type { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
declare const PedidoVentaController: {
    list: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    get: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    create: (req: AuthenticatedRequest, res: Response) => Promise<void>;
};
export default PedidoVentaController;
//# sourceMappingURL=PedidoVentaController.d.ts.map