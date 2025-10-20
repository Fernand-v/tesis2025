import type { Request, Response } from 'express';
declare const CajaController: {
    list: (_req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
export default CajaController;
//# sourceMappingURL=CajaController.d.ts.map