import type { Request, Response } from 'express';
declare const RoleController: {
    list: (_req: Request, res: Response) => Promise<void>;
    detail: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
    addProgram: (req: Request, res: Response) => Promise<void>;
    removeProgram: (req: Request, res: Response) => Promise<void>;
};
export default RoleController;
//# sourceMappingURL=RoleController.d.ts.map