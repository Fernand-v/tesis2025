"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const auth_1 = require("../middleware/auth");
const catalog_1 = __importDefault(require("./catalog"));
const sales_1 = __importDefault(require("./sales"));
const admin_1 = __importDefault(require("./admin"));
const reports_1 = __importDefault(require("./reports"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.post('/auth/register', AuthController_1.default.register);
router.post('/auth/login', AuthController_1.default.login);
router.get('/auth/profile', auth_1.authenticateToken, AuthController_1.default.profile);
router.use('/catalog', auth_1.authenticateToken, catalog_1.default);
router.use('/sales', auth_1.authenticateToken, sales_1.default);
router.use('/admin', auth_1.authenticateToken, admin_1.default);
router.use('/reports', auth_1.authenticateToken, reports_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map