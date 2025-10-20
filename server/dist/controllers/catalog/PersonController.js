"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PersonService_1 = __importDefault(require("../../services/catalog/PersonService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const sanitizePersonInput = (body) => {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : '';
    const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
    const celular = typeof body.celular === 'string' ? body.celular.trim() : '';
    const direccion = typeof body.direccion === 'string' ? body.direccion.trim() : '';
    const activo = typeof body.activo === 'string' ? body.activo.trim().toUpperCase() : '';
    const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
    const ruc = typeof body.ruc === 'string' ? body.ruc.trim() : '';
    const documento = typeof body.documento === 'string' ? body.documento.trim() : '';
    const digitoVerificador = typeof body.digitoVerificador === 'string' ? body.digitoVerificador.trim() : '';
    const observacionValue = typeof body.observacion === 'string' ? body.observacion.trim() : '';
    const observacion = observacionValue === '' ? null : observacionValue;
    const estadoCivil = typeof body.estadoCivil === 'string' ? body.estadoCivil.trim() : '';
    const fechaNacimiento = typeof body.fechaNacimiento === 'string' ? body.fechaNacimiento : '';
    const tipoDocumentoCodigo = typeof body.tipoDocumentoCodigo === 'number' && !Number.isNaN(body.tipoDocumentoCodigo)
        ? body.tipoDocumentoCodigo
        : null;
    if (!nombre ||
        !apellido ||
        !telefono ||
        !celular ||
        !direccion ||
        !activo ||
        !correo ||
        !ruc ||
        !documento ||
        !digitoVerificador ||
        !estadoCivil ||
        !fechaNacimiento ||
        tipoDocumentoCodigo === null) {
        return null;
    }
    return {
        nombre,
        apellido,
        telefono,
        celular,
        direccion,
        activo,
        correo,
        ruc,
        documento,
        digitoVerificador,
        observacion,
        estadoCivil,
        fechaNacimiento,
        tipoDocumentoCodigo,
    };
};
const PersonController = {
    list: async (_req, res) => {
        const personas = await PersonService_1.default.list();
        res.json({ personas });
    },
    detail: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const detail = await PersonService_1.default.getDetail(codigo);
        if (!detail) {
            res.status(404).json({ message: 'Persona no encontrada' });
            return;
        }
        res.json(detail);
    },
    create: async (req, res) => {
        const payload = sanitizePersonInput(req.body);
        if (!payload) {
            res.status(400).json({ message: 'Datos incompletos' });
            return;
        }
        try {
            const detail = await PersonService_1.default.create(payload);
            res.status(201).json(detail);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const payload = sanitizePersonInput(req.body);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!payload) {
            res.status(400).json({ message: 'Datos incompletos' });
            return;
        }
        const detail = await PersonService_1.default.update(codigo, payload);
        if (!detail) {
            res.status(404).json({ message: 'Persona no encontrada' });
            return;
        }
        res.json(detail);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await PersonService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Persona no encontrada' });
            return;
        }
        res.status(204).send();
    },
    addType: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const { tipoCodigo } = req.body;
        const tipoId = typeof tipoCodigo === 'number' ? tipoCodigo : NaN;
        if (codigo === null || Number.isNaN(tipoId)) {
            res.status(400).json({ message: 'Datos invalidos' });
            return;
        }
        const detail = await PersonService_1.default.addType(codigo, tipoId);
        if (!detail) {
            res.status(404).json({ message: 'Persona no encontrada' });
            return;
        }
        res.json(detail);
    },
    removeType: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const tipoCodigo = parseCodigo(req.params.tipoCodigo);
        if (codigo === null || tipoCodigo === null) {
            res.status(400).json({ message: 'Datos invalidos' });
            return;
        }
        const detail = await PersonService_1.default.removeType(codigo, tipoCodigo);
        if (!detail) {
            res.status(404).json({ message: 'Persona no encontrada' });
            return;
        }
        res.json(detail);
    },
};
exports.default = PersonController;
//# sourceMappingURL=PersonController.js.map