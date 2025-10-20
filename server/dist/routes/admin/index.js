"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BackupController_1 = __importDefault(require("../../controllers/admin/BackupController"));
const roles_1 = require("../../middleware/roles");
const router = (0, express_1.Router)();
router.post('/backup/database', (0, roles_1.requireRole)([1]), BackupController_1.default.create);
exports.default = router;
//# sourceMappingURL=index.js.map