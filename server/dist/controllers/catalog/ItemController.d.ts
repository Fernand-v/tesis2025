import type { Request, Response } from 'express';
declare const ItemController: {
    list: (_req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
export default ItemController;
//# sourceMappingURL=ItemController.d.ts.map