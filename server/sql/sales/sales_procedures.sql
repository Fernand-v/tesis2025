-- Procedimientos relacionados con el módulo de ventas.
-- Ejecutar este script en la base de datos `tesis2025` antes de utilizar los endpoints.

USE `tesis2025`;

DELIMITER $$

-- =====================================================
-- Aperturas de caja
-- =====================================================
DROP PROCEDURE IF EXISTS sp_fin_apertura_caja_list $$
CREATE PROCEDURE sp_fin_apertura_caja_list()
BEGIN
  SELECT aper.APCAJ_CODIGO,
         aper.APCAJ_FECHA,
         aper.APCAJ_MONTO_APER,
         aper.APCAJ_MONTO_ANT,
         aper.APCAJ_CAJA,
         caja.CAJ_DESC,
         aper.APCAJ_USER,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO,
         aper.APCAJ_ESTADO,
         estado.EST_DESC,
         aper.APCAJ_FEC_GRAB
    FROM fin_apertura_caja aper
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = aper.APCAJ_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = aper.APCAJ_USER
    JOIN GEN_ESTADO estado
      ON estado.EST_CODIGO = aper.APCAJ_ESTADO
   ORDER BY aper.APCAJ_FECHA DESC, aper.APCAJ_CODIGO DESC;
END $$

DROP PROCEDURE IF EXISTS sp_fin_apertura_caja_get $$
CREATE PROCEDURE sp_fin_apertura_caja_get(IN p_codigo INT)
BEGIN
  SELECT aper.APCAJ_CODIGO,
         aper.APCAJ_FECHA,
         aper.APCAJ_MONTO_APER,
         aper.APCAJ_MONTO_ANT,
         aper.APCAJ_CAJA,
         caja.CAJ_DESC,
         aper.APCAJ_USER,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO,
         aper.APCAJ_ESTADO,
         estado.EST_DESC,
         aper.APCAJ_FEC_GRAB
    FROM fin_apertura_caja aper
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = aper.APCAJ_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = aper.APCAJ_USER
    JOIN GEN_ESTADO estado
      ON estado.EST_CODIGO = aper.APCAJ_ESTADO
   WHERE aper.APCAJ_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_fin_apertura_caja_create $$
CREATE PROCEDURE sp_fin_apertura_caja_create(
  IN p_monto DOUBLE,
  IN p_caja INT,
  IN p_usuario INT,
  IN p_estado INT
)
BEGIN
  DECLARE v_codigo INT;
  DECLARE v_monto_anterior DOUBLE DEFAULT 0;

  IF NOT EXISTS (
    SELECT 1
      FROM fin_caj_a_user rel
     WHERE rel.CAJU_CAJA = p_caja
       AND rel.CAJU_USUARIO = p_usuario
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Usuario no asignado a la caja';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM fin_apertura_caja aper
     WHERE aper.APCAJ_USER = p_usuario
       AND aper.APCAJ_ESTADO = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
     SET MESSAGE_TEXT = 'El usuario ya posee una apertura activa';
  END IF;

  SELECT IFNULL(MAX(APCAJ_CODIGO), 0) + 1
    INTO v_codigo
    FROM fin_apertura_caja;

  SELECT cierre.CCAJ_DIFERENCIA
    INTO v_monto_anterior
    FROM fin_cierre_caja cierre
    JOIN fin_apertura_caja aper_prev
      ON aper_prev.APCAJ_CODIGO = cierre.CCAJ_APERTURA
   WHERE aper_prev.APCAJ_USER = p_usuario
   ORDER BY cierre.CCAJ_FECHA DESC, cierre.CCAJ_APERTURA DESC
   LIMIT 1;

  IF v_monto_anterior IS NULL THEN
    SET v_monto_anterior = 0;
  END IF;

  INSERT INTO fin_apertura_caja (
    APCAJ_CODIGO,
    APCAJ_FECHA,
    APCAJ_MONTO_APER,
    APCAJ_CAJA,
    APCAJ_USER,
    APCAJ_FEC_GRAB,
    APCAJ_ESTADO,
    APCAJ_MONTO_ANT
  ) VALUES (
    v_codigo,
    CURRENT_DATE(),
    p_monto,
    p_caja,
    p_usuario,
    NOW(),
    p_estado,
    v_monto_anterior
  );

  CALL sp_fin_apertura_caja_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_fin_apertura_caja_detail $$
CREATE PROCEDURE sp_fin_apertura_caja_detail(IN p_codigo INT)
BEGIN
  SELECT det.DAPCAJ_APERTURA,
         det.DAPCAJ_TPO_MONEDA,
         det.DAPCAJ_CANTIDAD,
         mon.TMON_DENOMINACION,
         mon.TMON_TASA,
         mon.TMON_SIMBOLO
    FROM fin_detalle_apertura_caja det
    JOIN gen_tpo_moneda mon
      ON mon.TMON_CODIGO = det.DAPCAJ_TPO_MONEDA
   WHERE det.DAPCAJ_APERTURA = p_codigo
   ORDER BY mon.TMON_DENOMINACION;
END $$

-- =====================================================
-- Apertura activa por usuario
-- =====================================================
DROP PROCEDURE IF EXISTS sp_fin_apertura_activa_por_usuario $$
CREATE PROCEDURE sp_fin_apertura_activa_por_usuario(IN p_usuario INT)
BEGIN
  SELECT aper.APCAJ_CODIGO,
         aper.APCAJ_FECHA,
         aper.APCAJ_ESTADO,
         aper.APCAJ_MONTO_APER
    FROM fin_apertura_caja aper
   WHERE aper.APCAJ_USER = p_usuario
     AND aper.APCAJ_ESTADO = 1
   ORDER BY aper.APCAJ_FECHA DESC, aper.APCAJ_CODIGO DESC
   LIMIT 1;
END $$

-- =====================================================
-- Pedidos de venta
-- =====================================================
DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_search $$
CREATE PROCEDURE sp_fin_pedido_venta_search(
  IN p_persona INT,
  IN p_estado INT,
  IN p_fecha_desde DATE,
  IN p_fecha_hasta DATE,
  IN p_texto VARCHAR(200)
)
BEGIN
  SELECT ped.PED_CODIGO,
         ped.PED_FECHA_PEDIDO,
         ped.PED_FECHA_ENTREGA,
         ped.PED_OBSERVACION,
         ped.PED_ADELANTO,
         ped.PED_FEC_GRAB,
         ped.PED_PERSONA,
         ped.PED_APERTURA,
         ped.PED_USER_GRAB,
         ped.PED_ESTADO,
         estado.EST_DESC AS ESTADO_DESCRIPCION,
         TRIM(CONCAT(IFNULL(persona.PER_NOMBRE, ''), ' ', IFNULL(persona.PER_APELLIDO, ''))) AS PERSONA_NOMBRE
    FROM fin_pedido_venta ped
    JOIN gen_persona persona
      ON persona.PER_CODIGO = ped.PED_PERSONA
    LEFT JOIN GEN_ESTADO estado
      ON estado.EST_CODIGO = ped.PED_ESTADO
   WHERE (p_persona IS NULL OR ped.PED_PERSONA = p_persona)
     AND (p_estado IS NULL OR ped.PED_ESTADO = p_estado)
     AND (p_fecha_desde IS NULL OR ped.PED_FECHA_PEDIDO >= p_fecha_desde)
     AND (p_fecha_hasta IS NULL OR ped.PED_FECHA_PEDIDO <= p_fecha_hasta)
     AND (
       p_texto IS NULL
       OR p_texto = ''
       OR persona.PER_NOMBRE LIKE CONCAT('%', p_texto, '%')
       OR persona.PER_APELLIDO LIKE CONCAT('%', p_texto, '%')
       OR ped.PED_OBSERVACION LIKE CONCAT('%', p_texto, '%')
     )
   ORDER BY ped.PED_FECHA_PEDIDO DESC, ped.PED_CODIGO DESC;

  SELECT det.DPED_CODIGO,
         det.DPED_PEDIDO,
         det.DPED_PRECIO,
         det.DPED_CANTIDAD,
         det.DPED_ITEM,
         item.ITEM_DESC
    FROM fin_detalle_pedido_venta det
    JOIN fin_pedido_venta ped
      ON ped.PED_CODIGO = det.DPED_PEDIDO
    JOIN gen_persona persona
      ON persona.PER_CODIGO = ped.PED_PERSONA
    JOIN stk_item item
      ON item.ITEM_CODIGO = det.DPED_ITEM
   WHERE (p_persona IS NULL OR ped.PED_PERSONA = p_persona)
     AND (p_estado IS NULL OR ped.PED_ESTADO = p_estado)
     AND (p_fecha_desde IS NULL OR ped.PED_FECHA_PEDIDO >= p_fecha_desde)
     AND (p_fecha_hasta IS NULL OR ped.PED_FECHA_PEDIDO <= p_fecha_hasta)
     AND (
       p_texto IS NULL
       OR p_texto = ''
       OR persona.PER_NOMBRE LIKE CONCAT('%', p_texto, '%')
       OR persona.PER_APELLIDO LIKE CONCAT('%', p_texto, '%')
       OR ped.PED_OBSERVACION LIKE CONCAT('%', p_texto, '%')
     )
   ORDER BY det.DPED_PEDIDO, det.DPED_CODIGO;
END $$

DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_list $$
CREATE PROCEDURE sp_fin_pedido_venta_list()
BEGIN
  CALL sp_fin_pedido_venta_search(NULL, NULL, NULL, NULL, NULL);
END $$

DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_get $$
CREATE PROCEDURE sp_fin_pedido_venta_get(IN p_codigo INT)
BEGIN
  SELECT ped.PED_CODIGO,
         ped.PED_FECHA_PEDIDO,
         ped.PED_FECHA_ENTREGA,
         ped.PED_OBSERVACION,
         ped.PED_ADELANTO,
         ped.PED_FEC_GRAB,
         ped.PED_PERSONA,
         ped.PED_APERTURA,
         ped.PED_USER_GRAB,
         ped.PED_ESTADO,
         TRIM(CONCAT(IFNULL(persona.PER_NOMBRE, ''), ' ', IFNULL(persona.PER_APELLIDO, ''))) AS PERSONA_NOMBRE
    FROM fin_pedido_venta ped
    JOIN gen_persona persona
      ON persona.PER_CODIGO = ped.PED_PERSONA
   WHERE ped.PED_CODIGO = p_codigo
   LIMIT 1;

  SELECT det.DPED_CODIGO,
         det.DPED_PEDIDO,
         det.DPED_PRECIO,
         det.DPED_CANTIDAD,
         det.DPED_ITEM,
         item.ITEM_DESC
    FROM fin_detalle_pedido_venta det
    JOIN stk_item item
      ON item.ITEM_CODIGO = det.DPED_ITEM
   WHERE det.DPED_PEDIDO = p_codigo
   ORDER BY det.DPED_CODIGO;
END $$

DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_create $$
CREATE PROCEDURE sp_fin_pedido_venta_create(
  IN p_fecha DATE,
  IN p_fecha_entrega DATE,
  IN p_observacion VARCHAR(450),
  IN p_adelanto DOUBLE,
  IN p_persona INT,
  IN p_apertura INT,
  IN p_usuario INT
)
BEGIN
  DECLARE v_codigo INT;
  DECLARE v_monto_anterior DOUBLE DEFAULT 0;

  IF NOT EXISTS (
    SELECT 1
      FROM gen_persona
     WHERE PER_CODIGO = p_persona
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Persona no encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM fin_apertura_caja
     WHERE APCAJ_CODIGO = p_apertura
       AND APCAJ_ESTADO = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Apertura no valida';
  END IF;

  SELECT IFNULL(MAX(PED_CODIGO), 0) + 1
    INTO v_codigo
    FROM fin_pedido_venta;

  INSERT INTO fin_pedido_venta (
    PED_CODIGO,
    PED_FECHA_PEDIDO,
    PED_FECHA_ENTREGA,
    PED_OBSERVACION,
    PED_ADELANTO,
    PED_FEC_GRAB,
    PED_PERSONA,
    PED_APERTURA,
    PED_USER_GRAB,
    PED_ESTADO
  ) VALUES (
    v_codigo,
    p_fecha,
    p_fecha_entrega,
    NULLIF(p_observacion, ''),
    IFNULL(p_adelanto, 0),
    NOW(),
    p_persona,
    p_apertura,
    p_usuario,
    1
  );

  CALL sp_fin_pedido_venta_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_add_item $$
CREATE PROCEDURE sp_fin_pedido_venta_add_item(
  IN p_pedido INT,
  IN p_item INT,
  IN p_cantidad INT,
  IN p_precio DOUBLE
)
BEGIN
  DECLARE v_codigo INT;
  DECLARE v_monto_anterior DOUBLE DEFAULT 0;

  IF NOT EXISTS (
    SELECT 1
      FROM fin_pedido_venta
     WHERE PED_CODIGO = p_pedido
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pedido no encontrado';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM stk_item
     WHERE ITEM_CODIGO = p_item
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Item no encontrado';
  END IF;

  IF p_cantidad <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cantidad invalida';
  END IF;

  IF p_precio < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Precio invalido';
  END IF;

  SELECT IFNULL(MAX(DPED_CODIGO), 0) + 1
    INTO v_codigo
    FROM fin_detalle_pedido_venta;

  INSERT INTO fin_detalle_pedido_venta (
    DPED_PEDIDO,
    DPED_PRECIO,
    DPED_CANTIDAD,
    DPED_ITEM,
    DPED_CODIGO
  ) VALUES (
    p_pedido,
    p_precio,
    p_cantidad,
    p_item,
    v_codigo
  );

  SELECT det.DPED_CODIGO,
         det.DPED_PEDIDO,
         det.DPED_PRECIO,
         det.DPED_CANTIDAD,
         det.DPED_ITEM,
         item.ITEM_DESC
    FROM fin_detalle_pedido_venta det
    JOIN stk_item item
      ON item.ITEM_CODIGO = det.DPED_ITEM
   WHERE det.DPED_CODIGO = v_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_registrar_adelanto $$
CREATE PROCEDURE sp_fin_pedido_venta_registrar_adelanto(
  IN p_pedido INT,
  IN p_apertura INT,
  IN p_monto DOUBLE,
  IN p_descripcion VARCHAR(450)
)
proc: BEGIN
  DECLARE v_arqueo INT;
  DECLARE v_detalle INT;

  IF p_monto <= 0 THEN
    LEAVE proc;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM fin_pedido_venta
     WHERE PED_CODIGO = p_pedido
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pedido no encontrado';
  END IF;

  SELECT ARQ_CODIGO
    INTO v_arqueo
    FROM fin_arqueo_caja
   WHERE ARQ_APERTURA = p_apertura
   LIMIT 1;

  IF v_arqueo IS NULL THEN
    SELECT IFNULL(MAX(ARQ_CODIGO), 0) + 1
      INTO v_arqueo
      FROM fin_arqueo_caja;

    INSERT INTO fin_arqueo_caja (
      ARQ_CODIGO,
      ARQ_FECHA,
      ARQ_ESTADO,
      ARQ_APERTURA
    ) VALUES (
      v_arqueo,
      CURRENT_DATE(),
      1,
      p_apertura
    );
  ELSE
    UPDATE fin_arqueo_caja
       SET ARQ_ESTADO = 1
     WHERE ARQ_CODIGO = v_arqueo
       AND ARQ_APERTURA = p_apertura;
  END IF;

  SELECT IFNULL(MAX(DARQ_CODIGO), 0) + 1
    INTO v_detalle
    FROM fin_detalle_arqueo_caja;

  INSERT INTO fin_detalle_arqueo_caja (
    DARQ_MONTO,
    DARQ_CODIGO,
    DARQ_ARQUEO,
    DARQ_APERTURA,
    DARQ_FECHA,
    DARQ_DESCRIPCION,
    DARQ_TIPO,
    DARQ_TPO_MONEDA,
    DARQ_CANTIDAD
  ) VALUES (
    p_monto,
    v_detalle,
    v_arqueo,
    p_apertura,
    NOW(),
    p_descripcion,
    'C',
    NULL,
    NULL
  );

  SELECT v_arqueo AS ARQ_CODIGO, v_detalle AS DARQ_CODIGO;
END $$

DROP PROCEDURE IF EXISTS sp_fin_pedido_venta_detail $$
CREATE PROCEDURE sp_fin_pedido_venta_detail(IN p_pedido INT)
BEGIN
  SELECT det.DPED_CODIGO,
         det.DPED_PEDIDO,
         det.DPED_PRECIO,
         det.DPED_CANTIDAD,
         det.DPED_ITEM,
         item.ITEM_DESC
    FROM fin_detalle_pedido_venta det
    JOIN stk_item item
      ON item.ITEM_CODIGO = det.DPED_ITEM
   WHERE det.DPED_PEDIDO = p_pedido
   ORDER BY det.DPED_CODIGO;
END $$

-- =====================================================
-- Arqueos de caja
-- =====================================================

DROP PROCEDURE IF EXISTS sp_fin_apertura_caja_lock $$
CREATE PROCEDURE sp_fin_apertura_caja_lock(IN p_codigo INT)
BEGIN
  SELECT aper.APCAJ_CODIGO,
         aper.APCAJ_FECHA,
         aper.APCAJ_MONTO_APER,
         aper.APCAJ_MONTO_ANT,
         aper.APCAJ_CAJA,
         caja.CAJ_DESC,
         aper.APCAJ_USER,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO,
         aper.APCAJ_ESTADO
    FROM fin_apertura_caja aper
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = aper.APCAJ_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = aper.APCAJ_USER
   WHERE aper.APCAJ_CODIGO = p_codigo
   LIMIT 1
   FOR UPDATE;
END $$

DROP PROCEDURE IF EXISTS sp_fin_arqueo_caja_list $$
CREATE PROCEDURE sp_fin_arqueo_caja_list(
  IN p_usuario INT,
  IN p_apertura INT
)
BEGIN
  SELECT arq.ARQ_CODIGO,
         arq.ARQ_APERTURA,
         arq.ARQ_FECHA,
         arq.ARQ_ESTADO,
         aper.APCAJ_CAJA,
         aper.APCAJ_USER,
         aper.APCAJ_MONTO_APER,
         aper.APCAJ_MONTO_ANT,
         aper.APCAJ_FECHA,
         caja.CAJ_DESC,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO,
         (
           SELECT det.DARQ_DESCRIPCION
             FROM fin_detalle_arqueo_caja det
            WHERE det.DARQ_APERTURA = arq.ARQ_APERTURA
              AND det.DARQ_TIPO = 'D'
            ORDER BY det.DARQ_FECHA ASC, det.DARQ_CODIGO ASC
            LIMIT 1
         ) AS ARQ_MOTIVO
    FROM fin_arqueo_caja arq
    JOIN fin_apertura_caja aper
      ON aper.APCAJ_CODIGO = arq.ARQ_APERTURA
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = aper.APCAJ_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = aper.APCAJ_USER
   WHERE (p_usuario IS NULL OR aper.APCAJ_USER = p_usuario)
     AND (p_apertura IS NULL OR arq.ARQ_APERTURA = p_apertura)
   ORDER BY arq.ARQ_FECHA DESC,
            arq.ARQ_CODIGO DESC;

  SELECT det.DARQ_CODIGO,
         det.DARQ_APERTURA,
         det.DARQ_FECHA,
         det.DARQ_DESCRIPCION,
         det.DARQ_TIPO,
         det.DARQ_TPO_MONEDA,
         det.DARQ_CANTIDAD,
         det.DARQ_MONTO,
         mon.TMON_DENOMINACION,
         mon.TMON_SIMBOLO,
         mon.TMON_TASA
    FROM fin_detalle_arqueo_caja det
    JOIN fin_apertura_caja aper
      ON aper.APCAJ_CODIGO = det.DARQ_APERTURA
    LEFT JOIN gen_tpo_moneda mon
      ON mon.TMON_CODIGO = det.DARQ_TPO_MONEDA
   WHERE (p_usuario IS NULL OR aper.APCAJ_USER = p_usuario)
     AND (p_apertura IS NULL OR det.DARQ_APERTURA = p_apertura)
   ORDER BY det.DARQ_APERTURA,
            det.DARQ_FECHA,
            det.DARQ_CODIGO;
END $$

DROP PROCEDURE IF EXISTS sp_fin_arqueo_caja_resumen $$
CREATE PROCEDURE sp_fin_arqueo_caja_resumen(IN p_apertura INT)
BEGIN
  SELECT aper.APCAJ_CODIGO,
         aper.APCAJ_CAJA,
         caja.CAJ_DESC,
         aper.APCAJ_FECHA,
         aper.APCAJ_MONTO_APER,
         aper.APCAJ_MONTO_ANT,
         aper.APCAJ_ESTADO,
         aper.APCAJ_USER,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO,
         COALESCE(SUM(CASE WHEN det.DARQ_TIPO = 'C' THEN det.DARQ_MONTO ELSE 0 END), 0) AS TOTAL_CREDITO,
         COALESCE(SUM(CASE WHEN det.DARQ_TIPO = 'D' THEN det.DARQ_MONTO ELSE 0 END), 0) AS TOTAL_DEBITO
    FROM fin_apertura_caja aper
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = aper.APCAJ_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = aper.APCAJ_USER
    LEFT JOIN fin_detalle_arqueo_caja det
      ON det.DARQ_APERTURA = aper.APCAJ_CODIGO
   WHERE aper.APCAJ_CODIGO = p_apertura
   GROUP BY aper.APCAJ_CODIGO,
            aper.APCAJ_CAJA,
            caja.CAJ_DESC,
            aper.APCAJ_FECHA,
            aper.APCAJ_MONTO_APER,
            aper.APCAJ_MONTO_ANT,
            aper.APCAJ_ESTADO,
            aper.APCAJ_USER,
            usuario.USER_USUARIO,
            usuario.USER_NOMBRE,
            usuario.USER_APELLIDO
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_fin_arqueo_caja_registrar_retiro $$
CREATE PROCEDURE sp_fin_arqueo_caja_registrar_retiro(
  IN p_apertura INT,
  IN p_moneda INT,
  IN p_cantidad DOUBLE,
  IN p_motivo VARCHAR(450),
  IN p_validar INT
)
BEGIN
  DECLARE v_arqueo INT;
  DECLARE v_detalle INT;
  DECLARE v_tasa DOUBLE;
  DECLARE v_monto DOUBLE;
  DECLARE v_total_debito DOUBLE;

  IF p_cantidad <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cantidad invalida';
  END IF;

  IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El motivo del arqueo es obligatorio';
  END IF;

  SELECT TMON_TASA
    INTO v_tasa
    FROM gen_tpo_moneda
   WHERE TMON_CODIGO = p_moneda
   LIMIT 1;

  IF v_tasa IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tipo de moneda no encontrado';
  END IF;

  SELECT ARQ_CODIGO
    INTO v_arqueo
    FROM fin_arqueo_caja
   WHERE ARQ_APERTURA = p_apertura
   LIMIT 1
   FOR UPDATE;

  IF v_arqueo IS NULL THEN
    SELECT IFNULL(MAX(ARQ_CODIGO), 0) + 1
      INTO v_arqueo
      FROM fin_arqueo_caja;

    INSERT INTO fin_arqueo_caja (
      ARQ_CODIGO,
      ARQ_FECHA,
      ARQ_ESTADO,
      ARQ_APERTURA
    ) VALUES (
      v_arqueo,
      CURRENT_DATE(),
      1,
      p_apertura
    );
  ELSE
    UPDATE fin_arqueo_caja
       SET ARQ_ESTADO = 1
     WHERE ARQ_CODIGO = v_arqueo
       AND ARQ_APERTURA = p_apertura;
  END IF;

  IF p_validar = 1 THEN
    SELECT COALESCE(SUM(CASE WHEN DARQ_TIPO = 'D' THEN DARQ_MONTO ELSE 0 END), 0)
      INTO v_total_debito
      FROM fin_detalle_arqueo_caja
     WHERE DARQ_APERTURA = p_apertura
     FOR UPDATE;

    
  END IF;

  SELECT IFNULL(MAX(DARQ_CODIGO), 0) + 1
    INTO v_detalle
    FROM fin_detalle_arqueo_caja;

  SET v_monto = v_tasa * p_cantidad;

  INSERT INTO fin_detalle_arqueo_caja (
    DARQ_MONTO,
    DARQ_CODIGO,
    DARQ_ARQUEO,
    DARQ_APERTURA,
    DARQ_FECHA,
    DARQ_DESCRIPCION,
    DARQ_TIPO,
    DARQ_TPO_MONEDA,
    DARQ_CANTIDAD
  ) VALUES (
    v_monto,
    v_detalle,
    v_arqueo,
    p_apertura,
    NOW(),
    p_motivo,
    'D',
    p_moneda,
    p_cantidad
  );

  SELECT v_arqueo AS ARQ_CODIGO, v_detalle AS DARQ_CODIGO, v_monto AS DARQ_MONTO;
END $$

DROP PROCEDURE IF EXISTS sp_fin_cierre_caja_create $$
CREATE PROCEDURE sp_fin_cierre_caja_create(
  IN p_apertura INT,
  IN p_usuario INT,
  IN p_monto DOUBLE,
  IN p_diferencia DOUBLE
)
BEGIN
  IF EXISTS (
    SELECT 1
      FROM fin_cierre_caja
     WHERE CCAJ_APERTURA = p_apertura
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La apertura ya fue cerrada';
  END IF;

  INSERT INTO fin_cierre_caja (
    CCAJ_APERTURA,
    CCAJ_FECHA,
    CCAJ_MONTO,
    CCAJ_DIFERENCIA
  ) VALUES (
    p_apertura,
    CURRENT_DATE(),
    p_monto,
    p_diferencia
  );

  UPDATE fin_apertura_caja
     SET APCAJ_ESTADO = 2,
         APCAJ_MONTO_ANT = p_diferencia,
         APCAJ_FEC_GRAB = NOW()
   WHERE APCAJ_CODIGO = p_apertura;
END $$

DROP PROCEDURE IF EXISTS sp_fin_cierre_caja_clear_detail $$
CREATE PROCEDURE sp_fin_cierre_caja_clear_detail(IN p_apertura INT)
BEGIN
  DELETE
    FROM fin_detalle_cierre_caja
   WHERE DCCAJ_APERTURA = p_apertura;
END $$

DROP PROCEDURE IF EXISTS sp_fin_cierre_caja_add_detail $$
CREATE PROCEDURE sp_fin_cierre_caja_add_detail(
  IN p_apertura INT,
  IN p_moneda INT,
  IN p_cantidad DOUBLE
)
BEGIN
  INSERT INTO fin_detalle_cierre_caja (
    DCCAJ_APERTURA,
    DCCAJ_TPO_MONEDA,
    DCCAJ_CANTIDAD
  ) VALUES (
    p_apertura,
    p_moneda,
    p_cantidad
  )
  ON DUPLICATE KEY UPDATE
    DCCAJ_CANTIDAD = VALUES(DCCAJ_CANTIDAD);
END $$

DROP PROCEDURE IF EXISTS sp_fin_cierre_caja_list $$
CREATE PROCEDURE sp_fin_cierre_caja_list(
  IN p_usuario INT,
  IN p_apertura INT
)
BEGIN
  SELECT cierre.CCAJ_APERTURA,
         cierre.CCAJ_FECHA,
         cierre.CCAJ_MONTO,
         cierre.CCAJ_DIFERENCIA,
         aper.APCAJ_CAJA,
         aper.APCAJ_MONTO_APER,
         aper.APCAJ_MONTO_ANT,
         aper.APCAJ_USER,
         aper.APCAJ_FECHA,
         caja.CAJ_DESC,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO,
         COALESCE(SUM(CASE WHEN det.DARQ_TIPO = 'C' THEN det.DARQ_MONTO ELSE 0 END), 0) AS TOTAL_CREDITO,
         COALESCE(SUM(CASE WHEN det.DARQ_TIPO = 'D' THEN det.DARQ_MONTO ELSE 0 END), 0) AS TOTAL_DEBITO
    FROM fin_cierre_caja cierre
    JOIN fin_apertura_caja aper
      ON aper.APCAJ_CODIGO = cierre.CCAJ_APERTURA
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = aper.APCAJ_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = aper.APCAJ_USER
    LEFT JOIN fin_detalle_arqueo_caja det
      ON det.DARQ_APERTURA = aper.APCAJ_CODIGO
   WHERE (p_usuario IS NULL OR aper.APCAJ_USER = p_usuario)
     AND (p_apertura IS NULL OR cierre.CCAJ_APERTURA = p_apertura)
   GROUP BY cierre.CCAJ_APERTURA,
            cierre.CCAJ_FECHA,
            cierre.CCAJ_MONTO,
            cierre.CCAJ_DIFERENCIA,
            aper.APCAJ_CAJA,
            aper.APCAJ_MONTO_APER,
            aper.APCAJ_MONTO_ANT,
            aper.APCAJ_USER,
            aper.APCAJ_FECHA,
            caja.CAJ_DESC,
            usuario.USER_USUARIO,
            usuario.USER_NOMBRE,
            usuario.USER_APELLIDO
   ORDER BY cierre.CCAJ_FECHA DESC,
            cierre.CCAJ_APERTURA DESC;

  SELECT det.DCCAJ_APERTURA,
         det.DCCAJ_TPO_MONEDA,
         det.DCCAJ_CANTIDAD,
         mon.TMON_DENOMINACION,
         mon.TMON_TASA,
         mon.TMON_SIMBOLO
    FROM fin_detalle_cierre_caja det
    LEFT JOIN gen_tpo_moneda mon
      ON mon.TMON_CODIGO = det.DCCAJ_TPO_MONEDA
   WHERE (p_apertura IS NULL OR det.DCCAJ_APERTURA = p_apertura)
   ORDER BY det.DCCAJ_APERTURA,
            mon.TMON_DENOMINACION;
END $$

DELIMITER ;

