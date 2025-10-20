import { Router } from 'express';

import AperturaCajaController from '../../controllers/sales/AperturaCajaController';
import ArqueoCajaController from '../../controllers/sales/ArqueoCajaController';
import CierreCajaController from '../../controllers/sales/CierreCajaController';
import PedidoVentaController from '../../controllers/sales/PedidoVentaController';

const router = Router();

router.get('/cash-openings', AperturaCajaController.list);
router.post('/cash-openings', AperturaCajaController.create);

router.get('/cash-audits/available', ArqueoCajaController.available);
router.get('/cash-audits', ArqueoCajaController.list);
router.post('/cash-audits', ArqueoCajaController.create);

router.get('/cash-closings/available', CierreCajaController.available);
router.get('/cash-closings', CierreCajaController.list);
router.post('/cash-closings', CierreCajaController.create);

router.get('/orders', PedidoVentaController.list);
router.get('/orders/:codigo', PedidoVentaController.get);
router.post('/orders', PedidoVentaController.create);

export default router;
