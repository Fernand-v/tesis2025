"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AperturaCajaController_1 = __importDefault(require("../../controllers/sales/AperturaCajaController"));
const ArqueoCajaController_1 = __importDefault(require("../../controllers/sales/ArqueoCajaController"));
const CierreCajaController_1 = __importDefault(require("../../controllers/sales/CierreCajaController"));
const PedidoVentaController_1 = __importDefault(require("../../controllers/sales/PedidoVentaController"));
const router = (0, express_1.Router)();
router.get('/cash-openings', AperturaCajaController_1.default.list);
router.post('/cash-openings', AperturaCajaController_1.default.create);
router.get('/cash-audits/available', ArqueoCajaController_1.default.available);
router.get('/cash-audits', ArqueoCajaController_1.default.list);
router.post('/cash-audits', ArqueoCajaController_1.default.create);
router.get('/cash-closings/available', CierreCajaController_1.default.available);
router.get('/cash-closings', CierreCajaController_1.default.list);
router.post('/cash-closings', CierreCajaController_1.default.create);
router.get('/orders', PedidoVentaController_1.default.list);
router.get('/orders/:codigo', PedidoVentaController_1.default.get);
router.post('/orders', PedidoVentaController_1.default.create);
exports.default = router;
//# sourceMappingURL=index.js.map