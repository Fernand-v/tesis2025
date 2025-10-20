import { Router } from 'express';

import RoleController from '../../controllers/catalog/RoleController';
import DocTypeController from '../../controllers/catalog/DocTypeController';
import CurrencyTypeController from '../../controllers/catalog/CurrencyTypeController';
import EstadoController from '../../controllers/catalog/EstadoController';
import TimbradoController from '../../controllers/catalog/TimbradoController';
import PaymentMethodController from '../../controllers/catalog/PaymentMethodController';
import FallaController from '../../controllers/catalog/FallaController';
import PersonTypeController from '../../controllers/catalog/PersonTypeController';
import ProgramTypeController from '../../controllers/catalog/ProgramTypeController';
import PersonController from '../../controllers/catalog/PersonController';
import EmpresaController from '../../controllers/catalog/EmpresaController';
import MotivoController from '../../controllers/catalog/MotivoController';
import CajaController from '../../controllers/catalog/CajaController';
import CajaUsuarioController from '../../controllers/catalog/CajaUsuarioController';
import DispositivoController from '../../controllers/catalog/DispositivoController';
import CategoriaIvaController from '../../controllers/catalog/CategoriaIvaController';
import ProgramController from '../../controllers/catalog/ProgramController';
import GrupoController from '../../controllers/catalog/GrupoController';
import MarcaController from '../../controllers/catalog/MarcaController';
import ModeloController from '../../controllers/catalog/ModeloController';
import ItemController from '../../controllers/catalog/ItemController';

const catalogRouter = Router();

catalogRouter.get('/roles', RoleController.list);
catalogRouter.post('/roles', RoleController.create);
catalogRouter.get('/roles/:codigo', RoleController.detail);
catalogRouter.put('/roles/:codigo', RoleController.update);
catalogRouter.delete('/roles/:codigo', RoleController.remove);
catalogRouter.post('/roles/:codigo/programs', RoleController.addProgram);
catalogRouter.delete('/roles/:codigo/programs/:programaCodigo', RoleController.removeProgram);

catalogRouter.get('/doc-types', DocTypeController.list);
catalogRouter.post('/doc-types', DocTypeController.create);
catalogRouter.put('/doc-types/:codigo', DocTypeController.update);
catalogRouter.delete('/doc-types/:codigo', DocTypeController.remove);

catalogRouter.get('/currencies', CurrencyTypeController.list);
catalogRouter.post('/currencies', CurrencyTypeController.create);
catalogRouter.put('/currencies/:codigo', CurrencyTypeController.update);
catalogRouter.delete('/currencies/:codigo', CurrencyTypeController.remove);

catalogRouter.get('/states', EstadoController.list);
catalogRouter.post('/states', EstadoController.create);
catalogRouter.put('/states/:codigo', EstadoController.update);
catalogRouter.delete('/states/:codigo', EstadoController.remove);

catalogRouter.get('/timbrados', TimbradoController.list);
catalogRouter.post('/timbrados', TimbradoController.create);
catalogRouter.put('/timbrados/:codigo', TimbradoController.update);
catalogRouter.delete('/timbrados/:codigo', TimbradoController.remove);

catalogRouter.get('/payment-methods', PaymentMethodController.list);
catalogRouter.post('/payment-methods', PaymentMethodController.create);
catalogRouter.put('/payment-methods/:codigo', PaymentMethodController.update);
catalogRouter.delete('/payment-methods/:codigo', PaymentMethodController.remove);

catalogRouter.get('/fallas', FallaController.list);
catalogRouter.post('/fallas', FallaController.create);
catalogRouter.put('/fallas/:codigo', FallaController.update);
catalogRouter.delete('/fallas/:codigo', FallaController.remove);

catalogRouter.get('/person-types', PersonTypeController.list);
catalogRouter.post('/person-types', PersonTypeController.create);
catalogRouter.put('/person-types/:codigo', PersonTypeController.update);
catalogRouter.delete('/person-types/:codigo', PersonTypeController.remove);

catalogRouter.get('/program-types', ProgramTypeController.list);
catalogRouter.post('/program-types', ProgramTypeController.create);
catalogRouter.put('/program-types/:codigo', ProgramTypeController.update);
catalogRouter.delete('/program-types/:codigo', ProgramTypeController.remove);

catalogRouter.get('/programs', ProgramController.list);
catalogRouter.post('/programs', ProgramController.create);
catalogRouter.put('/programs/:codigo', ProgramController.update);
catalogRouter.delete('/programs/:codigo', ProgramController.remove);

catalogRouter.get('/persons', PersonController.list);
catalogRouter.post('/persons', PersonController.create);
catalogRouter.get('/persons/:codigo', PersonController.detail);
catalogRouter.put('/persons/:codigo', PersonController.update);
catalogRouter.delete('/persons/:codigo', PersonController.remove);
catalogRouter.post('/persons/:codigo/types', PersonController.addType);
catalogRouter.delete('/persons/:codigo/types/:tipoCodigo', PersonController.removeType);

catalogRouter.get('/companies', EmpresaController.list);
catalogRouter.post('/companies', EmpresaController.create);
catalogRouter.put('/companies/:codigo', EmpresaController.update);
catalogRouter.delete('/companies/:codigo', EmpresaController.remove);

catalogRouter.get('/motives', MotivoController.list);
catalogRouter.post('/motives', MotivoController.create);
catalogRouter.put('/motives/:codigo', MotivoController.update);
catalogRouter.delete('/motives/:codigo', MotivoController.remove);

catalogRouter.get('/cash-registers', CajaController.list);
catalogRouter.post('/cash-registers', CajaController.create);
catalogRouter.put('/cash-registers/:codigo', CajaController.update);
catalogRouter.delete('/cash-registers/:codigo', CajaController.remove);

catalogRouter.get('/cash-register-users', CajaUsuarioController.overview);
catalogRouter.post('/cash-register-users', CajaUsuarioController.create);
catalogRouter.delete('/cash-register-users/:cajaCodigo/:usuarioCodigo', CajaUsuarioController.remove);

catalogRouter.get('/devices', DispositivoController.list);
catalogRouter.post('/devices', DispositivoController.create);
catalogRouter.put('/devices/:codigo', DispositivoController.update);
catalogRouter.delete('/devices/:codigo', DispositivoController.remove);

catalogRouter.get('/inventory/taxes', CategoriaIvaController.list);
catalogRouter.post('/inventory/taxes', CategoriaIvaController.create);
catalogRouter.put('/inventory/taxes/:codigo', CategoriaIvaController.update);
catalogRouter.delete('/inventory/taxes/:codigo', CategoriaIvaController.remove);

catalogRouter.get('/inventory/groups', GrupoController.list);
catalogRouter.post('/inventory/groups', GrupoController.create);
catalogRouter.put('/inventory/groups/:codigo', GrupoController.update);
catalogRouter.delete('/inventory/groups/:codigo', GrupoController.remove);

catalogRouter.get('/inventory/brands', MarcaController.list);
catalogRouter.post('/inventory/brands', MarcaController.create);
catalogRouter.put('/inventory/brands/:codigo', MarcaController.update);
catalogRouter.delete('/inventory/brands/:codigo', MarcaController.remove);

catalogRouter.get('/inventory/models', ModeloController.list);
catalogRouter.post('/inventory/models', ModeloController.create);
catalogRouter.put('/inventory/models/:codigo', ModeloController.update);
catalogRouter.delete('/inventory/models/:codigo', ModeloController.remove);

catalogRouter.get('/inventory/items', ItemController.list);
catalogRouter.post('/inventory/items', ItemController.create);
catalogRouter.put('/inventory/items/:codigo', ItemController.update);
catalogRouter.delete('/inventory/items/:codigo', ItemController.remove);

export default catalogRouter;

