"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
const promise_1 = require("mysql2/promise");
const env_1 = __importDefault(require("../config/env"));
let pool = null;
const getPool = () => {
    if (!pool) {
        pool = (0, promise_1.createPool)({
            host: env_1.default.database.host,
            port: env_1.default.database.port,
            user: env_1.default.database.user,
            password: env_1.default.database.password,
            database: env_1.default.database.name,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }
    return pool;
};
exports.getPool = getPool;
exports.default = exports.getPool;
//# sourceMappingURL=pool.js.map