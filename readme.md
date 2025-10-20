> **Visión**: este repositorio documenta la estructura actual y sirve de base para evolucionar el modelo en los próximos sprints (migraciones, validaciones automáticas y generación de ERD).

## 1) Resumen ejecutivo
- **Alcance**: clasificación de tablas en *fuertes* (maestras), *débiles* (puentes/identificantes), y mapeo *maestro ↔ detalle* por dominio (Inventario/Servicio, Compras, Ventas, Caja, Catálogos).
- **Uso recomendado**: utilice este README como referencia rápida al desarrollar queries, vistas, procedimientos y validaciones, y como checklist previo a releases.

---

## 2) Tablas fuertes (catálogos / entidades núcleo)
No dependen de otras para existir o representan catálogos de referencia (roles, estados, motivos, etc.).

- `gen_rol`, `GEN_ESTADO`, `GEN_MOTIVO`
- `STK_MODELO`, `stk_marca`, `stk_categoria_iva`, `stk_grupo`
- `gen_forma_pago`, `gen_tpo_moneda`, `gen_tpo_persona`, `gen_tpo_programa`, `gen_tpo_doc`
- `gen_programa`, `gen_prog_a_rol`*
- `gen_empresa`
- **Entidades núcleo con datos**: `gen_persona`, `stk_item`, `STK_DISPOSITIVO`

\*`gen_prog_a_rol` actúa como puente dentro del dominio de seguridad/menú.

---

## 3) Cabeceras transaccionales (maestro)
Encabezan conjuntos detalle y/o procesos:

- **Inventario/Servicio**: `STK_INVENTARIO`, `SER_RECEPCION`, `SER_DIAGNOSTICO`, `SER_PRESUPUESTO`, `fin_orden_trabajo`, `fin_servicio`, `SER_RETIRO`, `gen_reclamo`
- **Compras**: `fin_presupuesto_compra`, `fin_pedido_compra`, `fin_orden_compra`, `fin_compra`, `fin_cuota_compra`, `fin_nota_credito_compra`, `fin_nota_debito_compra`, `fin_recibo_compra`
- **Ventas**: `fin_pedido_venta`, `fin_venta`, `fin_cuota_venta`, `fin_nota_credito_venta`, `fin_nota_debito_venta`, `fin_recibo_venta`
- **Caja**: `fin_apertura_caja`, `fin_arqueo_caja`, `fin_cierre_caja`
- **Vínculos de proceso**: `fin_venta_a_fin_pedido_venta`, `fin_compra_a_fin_orden_compra` (puentes entre cabeceras)

---

## 4) Detalles (hijas)
Contienen líneas asociadas a una cabecera y catálogos:

- **Inventario/Servicio**
  - `STK_DETALLE_INVENTARIO` → `STK_INVENTARIO`, `stk_item`
  - `SER_DETALLE_PRESUPUESTO` → `SER_PRESUPUESTO`, `stk_item`
  - `FIN_DETALLE_SERVICIO` → `fin_servicio`, `stk_item`
  - `SER_DIAGNOSTICO_has_GEN_FALLA` (detalle/puente N–N)

- **Compras**
  - `fin_detalle_presupuesto_compra` → `fin_presupuesto_compra`, `stk_item`
  - `fin_detalle_orden_compra` → *(debe referenciar `fin_orden_compra`)*, `stk_item`
  - `fin_detalle_compra` → `fin_compra`, `stk_item`
  - `fin_detalle_cuota_compra` → `fin_cuota_compra`
  - `fin_detalle_nota_credito_compra` → `fin_nota_credito_compra`, `stk_item`
  - `fin_detalle_nota_debito_compra` → `fin_nota_debito_compra`, `stk_item`

- **Ventas**
  - `fin_detalle_pedido_venta` → `fin_pedido_venta`, `stk_item`
  - `fin_detalle_venta` → `fin_venta`, `stk_item`
  - `fin_detalle_cuota_venta` → `fin_cuota_venta`
  - `fin_detalle_nota_credito_venta` → `fin_nota_credito_venta`, `stk_item`
  - `fin_detalle_nota_debito_venta` → `fin_nota_debito_venta`, `stk_item`

- **Caja**
  - `fin_detalle_apertura_caja` → `fin_apertura_caja`, `gen_tpo_moneda`
  - `fin_detalle_arqueo_caja` → `fin_arqueo_caja`, `gen_tpo_moneda`
  - `fin_detalle_cierre_caja` → `fin_cierre_caja`, `gen_tpo_moneda`

---

## 5) Tablas débiles (puentes/identificantes)
PK es FK (total o parcial) o tablas N–N.

- **Puentes N–N**
  - `SER_RECEPCION_has_STK_DISPOSITIVO` (recepción ↔ dispositivo)
  - `SER_DIAGNOSTICO_has_GEN_FALLA` (diagnóstico ↔ falla)
  - `fin_caj_a_user` (caja ↔ usuario)
  - `fin_compra_a_fin_orden_compra` (compra ↔ orden compra)
  - `gen_persona_a_gen_tpo_persona` (persona ↔ tipo persona)
  - `fin_venta_a_fin_pedido_venta` (venta ↔ pedido venta)

- **Identificantes (PK = FK a la cabecera)**
  - `SER_PRESUPUESTO` (PK = `PRE_DIAGNOSTICO`)
  - `fin_orden_trabajo` (PK = `OTRA_PRESUPUESTO`)
  - `SER_RETIRO` (PK = `RET_SERVICIO` → `fin_servicio`.`SER_ORDEN`)
  - `fin_cierre_caja` (PK = `CCAJ_APERTURA`)
  - `fin_cuota_compra` (PK = `CCOMP_COMPRA`)
  - `fin_cuota_venta` (PK = `CVEN_VENTA`)
  - `fin_nota_credito_venta` (PK = `NCRED_VENTA`)
  - `fin_nota_credito_compra` (PK = `NCRED_COMPRA`)
  - `fin_nota_debito_compra` (PK = `NDEB_COMPRA`)
  - `fin_nota_debito_venta` (PK = `NDEB_VENTA`)
  - `gen_reclamo` (PK = `REC_SERVICIO`)

> **Nota**: si ya ajustaste las FKs/PKs, mantén este bloque como documentación histórica y marca los cambios en el *Changelog* (sección 10).

---

## 6) Pares maestro ↔ detalle (mapa rápido)
- `STK_INVENTARIO` ↔ `STK_DETALLE_INVENTARIO`
- `SER_RECEPCION` ↔ `SER_RECEPCION_has_STK_DISPOSITIVO` → `SER_DIAGNOSTICO` → `SER_PRESUPUESTO` → `fin_orden_trabajo` → `fin_servicio` ↔ `FIN_DETALLE_SERVICIO` → `SER_RETIRO` / `gen_reclamo`
- `SER_PRESUPUESTO` ↔ `SER_DETALLE_PRESUPUESTO`
- **Compras**:  
  `fin_presupuesto_compra` ↔ `fin_detalle_presupuesto_compra` → `fin_pedido_compra` → `fin_orden_compra` ↔ `fin_detalle_orden_compra` → `fin_compra` ↔ `fin_detalle_compra` → `fin_cuota_compra` ↔ `fin_detalle_cuota_compra` → `fin_recibo_compra`  
  Notas: `fin_nota_credito_compra` ↔ `fin_detalle_nota_credito_compra`; `fin_nota_debito_compra` ↔ `fin_detalle_nota_debito_compra`
- **Ventas**:  
  `fin_pedido_venta` ↔ `fin_detalle_pedido_venta` → `fin_venta` ↔ `fin_detalle_venta` → `fin_cuota_venta` ↔ `fin_detalle_cuota_venta` → `fin_recibo_venta`  
  Notas: `fin_nota_credito_venta` ↔ `fin_detalle_nota_credito_venta`; `fin_nota_debito_venta` ↔ `fin_detalle_nota_debito_venta`
- **Caja**:  
  `fin_apertura_caja` ↔ `fin_detalle_apertura_caja` → `fin_arqueo_caja` ↔ `fin_detalle_arqueo_caja` → `fin_cierre_caja` ↔ `fin_detalle_cierre_caja`

---

## 7) Reglas de integridad sugeridas (post-ajustes)
- **FK obligatorias en todos los detalles** a su cabecera y a catálogos clave (`stk_item`, `gen_tpo_moneda`, etc.).
- **Únicos e índices**: garantizar unicidad natural donde aplique (p.ej., `SER_ORDEN` si se usa como referencia externa), y agregar índices a las columnas FK para performance.
- **Estados/Workflow**: FKs a `GEN_ESTADO` con restricciones (CHECK) para asegurar transiciones válidas por tipo de documento.
- **Moneda y tipo de cambio**: normalizar manejo de `gen_tpo_moneda` y, si aplica, una tabla de cotizaciones con vigencia.
- **Borrado lógico**: campos estandarizados (`activo`, `fecha_baja`, `usuario_baja`) en tablas maestras para auditoría.
- **Auditoría**: triggers o tablas de historial para operaciones críticas (ventas, compras, caja).

---

## 8) Convenciones de nombres (recomendadas hacia adelante)
- Prefijos por dominio (`fin_`, `stk_`, `ser_`, `gen_`).
- PK simple autoincremental (`*_CODIGO`) y FKs con el nombre de la tabla referenciada (`*_TABLA`).
- Evitar nombres con mayúsculas mixtas; usar `snake_case` consistente.
- Sufijos estándar: `_detalle` para líneas; `_a_` para puentes N–N.

---

## 9) Consultas de ejemplo (plantillas)
- **Detalle de venta por cabecera**  
  ```sql
  SELECT v.VEN_CODIGO, d.*, i.stk_descripcion
  FROM fin_venta v
  JOIN fin_detalle_venta d  ON d.VEND_VENTA = v.VEN_CODIGO
  JOIN stk_item i           ON i.STK_CODIGO  = d.VEND_ITEM
  WHERE v.VEN_CODIGO = :id;