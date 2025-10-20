-- Procedimientos para mantenimiento de catalogos generales.
-- Ejecutar este script en la base de datos `tesis2025` antes de utilizar los endpoints.

USE `tesis2025`;

DELIMITER $$

-- =====================================================
-- Roles
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_rol_list $$
CREATE PROCEDURE sp_gen_rol_list()
BEGIN
  SELECT ROL_CODIGO, ROL_DESC
    FROM gen_rol
   ORDER BY ROL_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_get $$
CREATE PROCEDURE sp_gen_rol_get(IN p_codigo INT)
BEGIN
  SELECT ROL_CODIGO, ROL_DESC
    FROM gen_rol
   WHERE ROL_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_create $$
CREATE PROCEDURE sp_gen_rol_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(ROL_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_rol;

  INSERT INTO gen_rol (ROL_CODIGO, ROL_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_rol_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_update $$
CREATE PROCEDURE sp_gen_rol_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE gen_rol
     SET ROL_DESC = p_desc
   WHERE ROL_CODIGO = p_codigo;

  CALL sp_gen_rol_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_delete $$
CREATE PROCEDURE sp_gen_rol_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_prog_a_rol
   WHERE PRGU_ROL = p_codigo;

  DELETE FROM gen_rol
   WHERE ROL_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_gen_programa_habilitados $$
CREATE PROCEDURE sp_gen_programa_habilitados()
BEGIN
  SELECT PRG_CODIGO,
         PRG_DESC,
         PRG_UBICACION,
         PRG_FORMULARIO,
         PRG_HABILITADO
    FROM gen_programa
   WHERE PRG_HABILITADO = 1
   ORDER BY PRG_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_program_detail $$
CREATE PROCEDURE sp_gen_rol_program_detail(IN p_rol INT)
BEGIN
  CALL sp_gen_rol_get(p_rol);

  SELECT prg.PRG_CODIGO,
         prg.PRG_DESC,
         prg.PRG_UBICACION,
         prg.PRG_FORMULARIO
    FROM gen_prog_a_rol rel
    JOIN gen_programa prg
      ON prg.PRG_CODIGO = rel.PRGU_PROGRAMA
   WHERE rel.PRGU_ROL = p_rol
     AND prg.PRG_HABILITADO = 1
   ORDER BY prg.PRG_DESC;

  SELECT prg.PRG_CODIGO,
         prg.PRG_DESC,
         prg.PRG_UBICACION,
         prg.PRG_FORMULARIO
    FROM gen_programa prg
   WHERE prg.PRG_HABILITADO = 1
     AND prg.PRG_CODIGO NOT IN (
           SELECT rel.PRGU_PROGRAMA
             FROM gen_prog_a_rol rel
            WHERE rel.PRGU_ROL = p_rol
         )
   ORDER BY prg.PRG_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_add_program $$
CREATE PROCEDURE sp_gen_rol_add_program(
  IN p_rol INT,
  IN p_programa INT
)
BEGIN
  INSERT IGNORE INTO gen_prog_a_rol (PRGU_ROL, PRGU_PROGRAMA)
  VALUES (p_rol, p_programa);

  CALL sp_gen_rol_program_detail(p_rol);
END $$

DROP PROCEDURE IF EXISTS sp_gen_rol_remove_program $$
CREATE PROCEDURE sp_gen_rol_remove_program(
  IN p_rol INT,
  IN p_programa INT
)
BEGIN
  DELETE FROM gen_prog_a_rol
   WHERE PRGU_ROL = p_rol
     AND PRGU_PROGRAMA = p_programa;

  CALL sp_gen_rol_program_detail(p_rol);
END $$

-- =====================================================
-- Tipos de documento
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_tpo_doc_list $$
CREATE PROCEDURE sp_gen_tpo_doc_list()
BEGIN
  SELECT TDOC_CODIGO, TDOC_DESC
    FROM gen_tpo_doc
   ORDER BY TDOC_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_doc_get $$
CREATE PROCEDURE sp_gen_tpo_doc_get(IN p_codigo INT)
BEGIN
  SELECT TDOC_CODIGO, TDOC_DESC
    FROM gen_tpo_doc
   WHERE TDOC_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_doc_create $$
CREATE PROCEDURE sp_gen_tpo_doc_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(TDOC_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_tpo_doc;

  INSERT INTO gen_tpo_doc (TDOC_CODIGO, TDOC_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_tpo_doc_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_doc_update $$
CREATE PROCEDURE sp_gen_tpo_doc_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE gen_tpo_doc
     SET TDOC_DESC = p_desc
   WHERE TDOC_CODIGO = p_codigo;

  CALL sp_gen_tpo_doc_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_doc_delete $$
CREATE PROCEDURE sp_gen_tpo_doc_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_tpo_doc
   WHERE TDOC_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Tipos de moneda
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_tpo_moneda_list $$
CREATE PROCEDURE sp_gen_tpo_moneda_list()
BEGIN
  SELECT TMON_CODIGO,
         TMON_DENOMINACION,
         TMON_TASA,
         TMON_SIMBOLO
    FROM gen_tpo_moneda
   ORDER BY TMON_DENOMINACION;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_moneda_get $$
CREATE PROCEDURE sp_gen_tpo_moneda_get(IN p_codigo INT)
BEGIN
  SELECT TMON_CODIGO,
         TMON_DENOMINACION,
         TMON_TASA,
         TMON_SIMBOLO
    FROM gen_tpo_moneda
   WHERE TMON_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_moneda_create $$
CREATE PROCEDURE sp_gen_tpo_moneda_create(
  IN p_denominacion VARCHAR(45),
  IN p_tasa DOUBLE,
  IN p_simbolo VARCHAR(45)
)
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(TMON_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_tpo_moneda;

  INSERT INTO gen_tpo_moneda (TMON_CODIGO, TMON_DENOMINACION, TMON_TASA, TMON_SIMBOLO)
  VALUES (v_codigo, p_denominacion, p_tasa, p_simbolo);

  CALL sp_gen_tpo_moneda_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_moneda_update $$
CREATE PROCEDURE sp_gen_tpo_moneda_update(
  IN p_codigo INT,
  IN p_denominacion VARCHAR(45),
  IN p_tasa DOUBLE,
  IN p_simbolo VARCHAR(45)
)
BEGIN
  UPDATE gen_tpo_moneda
     SET TMON_DENOMINACION = p_denominacion,
         TMON_TASA = p_tasa,
         TMON_SIMBOLO = p_simbolo
   WHERE TMON_CODIGO = p_codigo;

  CALL sp_gen_tpo_moneda_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_moneda_delete $$
CREATE PROCEDURE sp_gen_tpo_moneda_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_tpo_moneda
   WHERE TMON_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Estados generales
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_estado_list $$
CREATE PROCEDURE sp_gen_estado_list()
BEGIN
  SELECT EST_CODIGO, EST_DESC
    FROM GEN_ESTADO
   ORDER BY EST_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_estado_get $$
CREATE PROCEDURE sp_gen_estado_get(IN p_codigo INT)
BEGIN
  SELECT EST_CODIGO, EST_DESC
    FROM GEN_ESTADO
   WHERE EST_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_estado_create $$
CREATE PROCEDURE sp_gen_estado_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(EST_CODIGO), 0) + 1
    INTO v_codigo
    FROM GEN_ESTADO;

  INSERT INTO GEN_ESTADO (EST_CODIGO, EST_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_estado_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_estado_update $$
CREATE PROCEDURE sp_gen_estado_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE GEN_ESTADO
     SET EST_DESC = p_desc
   WHERE EST_CODIGO = p_codigo;

  CALL sp_gen_estado_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_estado_delete $$
CREATE PROCEDURE sp_gen_estado_delete(IN p_codigo INT)
BEGIN
  DELETE FROM GEN_ESTADO
   WHERE EST_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Timbrados
-- =====================================================
DROP PROCEDURE IF EXISTS sp_fin_timbrado_list $$
CREATE PROCEDURE sp_fin_timbrado_list()
BEGIN
  SELECT TIMB_CODIGO,
         TIMB_NRO,
         TIMB_FECHA_INI,
         TIMB_FECHA_FIN,
         TIMB_DIGITO_DESDE,
         TIMB_DIGITO_HASTA,
         TIMB_ACTIVO,
         TIMB_AUTORIZACION,
         TIMB_PUNTO_EXP,
         TIMB_ESTABLECIMIENTO
    FROM fin_timbrado
   ORDER BY TIMB_CODIGO DESC;
END $$

DROP PROCEDURE IF EXISTS sp_fin_timbrado_get $$
CREATE PROCEDURE sp_fin_timbrado_get(IN p_codigo INT)
BEGIN
  SELECT TIMB_CODIGO,
         TIMB_NRO,
         TIMB_FECHA_INI,
         TIMB_FECHA_FIN,
         TIMB_DIGITO_DESDE,
         TIMB_DIGITO_HASTA,
         TIMB_ACTIVO,
         TIMB_AUTORIZACION,
         TIMB_PUNTO_EXP,
         TIMB_ESTABLECIMIENTO
    FROM fin_timbrado
   WHERE TIMB_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_fin_timbrado_create $$
CREATE PROCEDURE sp_fin_timbrado_create(
  IN p_nro VARCHAR(10),
  IN p_fecha_ini DATE,
  IN p_fecha_fin DATE,
  IN p_digito_desde VARCHAR(7),
  IN p_digito_hasta VARCHAR(7),
  IN p_activo VARCHAR(1),
  IN p_autorizacion VARCHAR(45),
  IN p_punto_exp INT,
  IN p_establecimiento INT
)
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(TIMB_CODIGO), 0) + 1
    INTO v_codigo
    FROM fin_timbrado;

  INSERT INTO fin_timbrado (
    TIMB_CODIGO,
    TIMB_NRO,
    TIMB_FECHA_INI,
    TIMB_FECHA_FIN,
    TIMB_DIGITO_DESDE,
    TIMB_DIGITO_HASTA,
    TIMB_ACTIVO,
    TIMB_AUTORIZACION,
    TIMB_PUNTO_EXP,
    TIMB_ESTABLECIMIENTO
  ) VALUES (
    v_codigo,
    p_nro,
    p_fecha_ini,
    p_fecha_fin,
    p_digito_desde,
    p_digito_hasta,
    p_activo,
    p_autorizacion,
    p_punto_exp,
    p_establecimiento
  );

  CALL sp_fin_timbrado_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_fin_timbrado_update $$
CREATE PROCEDURE sp_fin_timbrado_update(
  IN p_codigo INT,
  IN p_nro VARCHAR(10),
  IN p_fecha_ini DATE,
  IN p_fecha_fin DATE,
  IN p_digito_desde VARCHAR(7),
  IN p_digito_hasta VARCHAR(7),
  IN p_activo VARCHAR(1),
  IN p_autorizacion VARCHAR(45),
  IN p_punto_exp INT,
  IN p_establecimiento INT
)
BEGIN
  UPDATE fin_timbrado
     SET TIMB_NRO = p_nro,
         TIMB_FECHA_INI = p_fecha_ini,
         TIMB_FECHA_FIN = p_fecha_fin,
         TIMB_DIGITO_DESDE = p_digito_desde,
         TIMB_DIGITO_HASTA = p_digito_hasta,
         TIMB_ACTIVO = p_activo,
         TIMB_AUTORIZACION = p_autorizacion,
         TIMB_PUNTO_EXP = p_punto_exp,
         TIMB_ESTABLECIMIENTO = p_establecimiento
   WHERE TIMB_CODIGO = p_codigo;

  CALL sp_fin_timbrado_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_fin_timbrado_delete $$
CREATE PROCEDURE sp_fin_timbrado_delete(IN p_codigo INT)
BEGIN
  DELETE FROM fin_timbrado
   WHERE TIMB_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Formas de pago
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_forma_pago_list $$
CREATE PROCEDURE sp_gen_forma_pago_list()
BEGIN
  SELECT FPAG_CODIGO, FPAG_DESC
    FROM gen_forma_pago
   ORDER BY FPAG_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_forma_pago_get $$
CREATE PROCEDURE sp_gen_forma_pago_get(IN p_codigo INT)
BEGIN
  SELECT FPAG_CODIGO, FPAG_DESC
    FROM gen_forma_pago
   WHERE FPAG_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_forma_pago_create $$
CREATE PROCEDURE sp_gen_forma_pago_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(FPAG_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_forma_pago;

  INSERT INTO gen_forma_pago (FPAG_CODIGO, FPAG_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_forma_pago_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_forma_pago_update $$
CREATE PROCEDURE sp_gen_forma_pago_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE gen_forma_pago
     SET FPAG_DESC = p_desc
   WHERE FPAG_CODIGO = p_codigo;

  CALL sp_gen_forma_pago_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_forma_pago_delete $$
CREATE PROCEDURE sp_gen_forma_pago_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_forma_pago
   WHERE FPAG_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Fallas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_falla_list $$
CREATE PROCEDURE sp_gen_falla_list()
BEGIN
  SELECT FAL_CODIGO, FAL_DESC
    FROM GEN_FALLA
   ORDER BY FAL_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_falla_get $$
CREATE PROCEDURE sp_gen_falla_get(IN p_codigo INT)
BEGIN
  SELECT FAL_CODIGO, FAL_DESC
    FROM GEN_FALLA
   WHERE FAL_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_falla_create $$
CREATE PROCEDURE sp_gen_falla_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(FAL_CODIGO), 0) + 1
    INTO v_codigo
    FROM GEN_FALLA;

  INSERT INTO GEN_FALLA (FAL_CODIGO, FAL_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_falla_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_falla_update $$
CREATE PROCEDURE sp_gen_falla_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE GEN_FALLA
     SET FAL_DESC = p_desc
   WHERE FAL_CODIGO = p_codigo;

  CALL sp_gen_falla_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_falla_delete $$
CREATE PROCEDURE sp_gen_falla_delete(IN p_codigo INT)
BEGIN
  DELETE FROM GEN_FALLA
   WHERE FAL_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Tipos de persona
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_tpo_persona_list $$
CREATE PROCEDURE sp_gen_tpo_persona_list()
BEGIN
  SELECT TPER_CODIGO, TPER_DESC
    FROM gen_tpo_persona
   ORDER BY TPER_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_persona_get $$
CREATE PROCEDURE sp_gen_tpo_persona_get(IN p_codigo INT)
BEGIN
  SELECT TPER_CODIGO, TPER_DESC
    FROM gen_tpo_persona
   WHERE TPER_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_persona_create $$
CREATE PROCEDURE sp_gen_tpo_persona_create(IN p_desc VARCHAR(450))
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(TPER_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_tpo_persona;

  INSERT INTO gen_tpo_persona (TPER_CODIGO, TPER_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_tpo_persona_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_persona_update $$
CREATE PROCEDURE sp_gen_tpo_persona_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(450)
)
BEGIN
  UPDATE gen_tpo_persona
     SET TPER_DESC = p_desc
   WHERE TPER_CODIGO = p_codigo;

  CALL sp_gen_tpo_persona_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_persona_delete $$
CREATE PROCEDURE sp_gen_tpo_persona_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_persona_a_gen_tpo_persona
   WHERE GEN_TPO_PERSONA = p_codigo;

  DELETE FROM gen_tpo_persona
   WHERE TPER_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Tipos de programa
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_tpo_programa_list $$
CREATE PROCEDURE sp_gen_tpo_programa_list()
BEGIN
  SELECT TPRO_CODIGO, TPRO_DESC
    FROM gen_tpo_programa
   ORDER BY TPRO_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_programa_get $$
CREATE PROCEDURE sp_gen_tpo_programa_get(IN p_codigo INT)
BEGIN
  SELECT TPRO_CODIGO, TPRO_DESC
    FROM gen_tpo_programa
   WHERE TPRO_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_programa_create $$
CREATE PROCEDURE sp_gen_tpo_programa_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(TPRO_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_tpo_programa;

  INSERT INTO gen_tpo_programa (TPRO_CODIGO, TPRO_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_tpo_programa_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_programa_update $$
CREATE PROCEDURE sp_gen_tpo_programa_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE gen_tpo_programa
     SET TPRO_DESC = p_desc
   WHERE TPRO_CODIGO = p_codigo;

  CALL sp_gen_tpo_programa_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_tpo_programa_delete $$
CREATE PROCEDURE sp_gen_tpo_programa_delete(IN p_codigo INT)
BEGIN
  UPDATE gen_programa
     SET PRG_TPO_PROG = NULL
   WHERE PRG_TPO_PROG = p_codigo;

  DELETE FROM gen_tpo_programa
   WHERE TPRO_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Programas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_programa_list $$
CREATE PROCEDURE sp_gen_programa_list()
BEGIN
  SELECT prog.PRG_CODIGO,
         prog.PRG_DESC,
         prog.PRG_UBICACION,
         prog.PRG_FORMULARIO,
         prog.PRG_HABILITADO,
         prog.PRG_TPO_PROG,
         tipo.TPRO_DESC
    FROM gen_programa prog
    JOIN gen_tpo_programa tipo
      ON tipo.TPRO_CODIGO = prog.PRG_TPO_PROG
   ORDER BY prog.PRG_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_programa_get $$
CREATE PROCEDURE sp_gen_programa_get(IN p_codigo INT)
BEGIN
  SELECT prog.PRG_CODIGO,
         prog.PRG_DESC,
         prog.PRG_UBICACION,
         prog.PRG_FORMULARIO,
         prog.PRG_HABILITADO,
         prog.PRG_TPO_PROG,
         tipo.TPRO_DESC
    FROM gen_programa prog
    JOIN gen_tpo_programa tipo
      ON tipo.TPRO_CODIGO = prog.PRG_TPO_PROG
   WHERE prog.PRG_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_programa_create $$
CREATE PROCEDURE sp_gen_programa_create(
  IN p_desc VARCHAR(45),
  IN p_ubicacion VARCHAR(45),
  IN p_formulario VARCHAR(45),
  IN p_habilitado INT,
  IN p_tipo INT
)
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(PRG_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_programa;

  INSERT INTO gen_programa (
    PRG_CODIGO,
    PRG_DESC,
    PRG_UBICACION,
    PRG_FORMULARIO,
    PRG_HABILITADO,
    PRG_TPO_PROG
  ) VALUES (
    v_codigo,
    p_desc,
    p_ubicacion,
    p_formulario,
    p_habilitado,
    p_tipo
  );

  CALL sp_gen_programa_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_programa_update $$
CREATE PROCEDURE sp_gen_programa_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45),
  IN p_ubicacion VARCHAR(45),
  IN p_formulario VARCHAR(45),
  IN p_habilitado INT,
  IN p_tipo INT
)
BEGIN
  UPDATE gen_programa
     SET PRG_DESC = p_desc,
         PRG_UBICACION = p_ubicacion,
         PRG_FORMULARIO = p_formulario,
         PRG_HABILITADO = p_habilitado,
         PRG_TPO_PROG = p_tipo
   WHERE PRG_CODIGO = p_codigo;

  CALL sp_gen_programa_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_programa_delete $$
CREATE PROCEDURE sp_gen_programa_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_prog_a_rol
   WHERE PRGU_PROGRAMA = p_codigo;

  DELETE FROM gen_programa
   WHERE PRG_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Personas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_persona_list $$
CREATE PROCEDURE sp_gen_persona_list()
BEGIN
  SELECT p.PER_CODIGO,
         p.PER_NOMBRE,
         p.PER_APELLIDO,
         p.PER_TELEFONO,
         p.PER_CELULAR,
         p.PER_CORREO,
         p.PER_RUC,
         p.PER_DOC_IDENT,
         p.PER_DIG_VERIFICADOR,
         p.PER_ACTIVO,
         p.PER_ESTADO_CIVIL,
         p.PER_FEC_NAC,
         p.PER_TIPO_DOC,
         doc.TDOC_DESC
    FROM gen_persona p
    JOIN gen_tpo_doc doc
      ON doc.TDOC_CODIGO = p.PER_TIPO_DOC
   ORDER BY p.PER_NOMBRE, p.PER_APELLIDO;
END $$

DROP PROCEDURE IF EXISTS sp_gen_persona_get $$
CREATE PROCEDURE sp_gen_persona_get(IN p_codigo INT)
BEGIN
  SELECT p.PER_CODIGO,
         p.PER_NOMBRE,
         p.PER_APELLIDO,
         p.PER_TELEFONO,
         p.PER_CELULAR,
         p.PER_DIRECCION,
         p.PER_ACTIVO,
         p.PER_FEC_GRAB,
         p.PER_CORREO,
         p.PER_RUC,
         p.PER_DOC_IDENT,
         p.PER_DIG_VERIFICADOR,
         p.PER_OBS,
         p.PER_ESTADO_CIVIL,
         p.PER_FEC_NAC,
         p.PER_TIPO_DOC,
         doc.TDOC_DESC
    FROM gen_persona p
    JOIN gen_tpo_doc doc
      ON doc.TDOC_CODIGO = p.PER_TIPO_DOC
   WHERE p.PER_CODIGO = p_codigo
   LIMIT 1;

  SELECT tpo.TPER_CODIGO,
         tpo.TPER_DESC
    FROM gen_persona_a_gen_tpo_persona rel
    JOIN gen_tpo_persona tpo
      ON tpo.TPER_CODIGO = rel.GEN_TPO_PERSONA
   WHERE rel.GEN_PERSONA = p_codigo
   ORDER BY tpo.TPER_DESC;

  SELECT tpo.TPER_CODIGO,
         tpo.TPER_DESC
    FROM gen_tpo_persona tpo
   WHERE tpo.TPER_CODIGO NOT IN (
           SELECT rel.GEN_TPO_PERSONA
             FROM gen_persona_a_gen_tpo_persona rel
            WHERE rel.GEN_PERSONA = p_codigo
         )
   ORDER BY tpo.TPER_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_persona_create $$
CREATE PROCEDURE sp_gen_persona_create(
  IN p_nombre VARCHAR(100),
  IN p_apellido VARCHAR(100),
  IN p_telefono VARCHAR(45),
  IN p_celular VARCHAR(45),
  IN p_direccion VARCHAR(450),
  IN p_activo VARCHAR(1),
  IN p_correo VARCHAR(45),
  IN p_ruc VARCHAR(45),
  IN p_doc_ident VARCHAR(45),
  IN p_dig_verificador VARCHAR(1),
  IN p_obs VARCHAR(450),
  IN p_estado_civil VARCHAR(45),
  IN p_fec_nac DATE,
  IN p_tipo_doc INT
)
BEGIN
  DECLARE v_codigo INT;
  SELECT IFNULL(MAX(PER_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_persona;

  INSERT INTO gen_persona (
    PER_CODIGO,
    PER_NOMBRE,
    PER_APELLIDO,
    PER_TELEFONO,
    PER_CELULAR,
    PER_DIRECCION,
    PER_ACTIVO,
    PER_CORREO,
    PER_RUC,
    PER_DOC_IDENT,
    PER_DIG_VERIFICADOR,
    PER_OBS,
    PER_ESTADO_CIVIL,
    PER_FEC_NAC,
    PER_TIPO_DOC
  ) VALUES (
    v_codigo,
    p_nombre,
    p_apellido,
    p_telefono,
    p_celular,
    p_direccion,
    p_activo,
    p_correo,
    p_ruc,
    p_doc_ident,
    p_dig_verificador,
    p_obs,
    p_estado_civil,
    p_fec_nac,
    p_tipo_doc
  );

  CALL sp_gen_persona_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_persona_update $$
CREATE PROCEDURE sp_gen_persona_update(
  IN p_codigo INT,
  IN p_nombre VARCHAR(100),
  IN p_apellido VARCHAR(100),
  IN p_telefono VARCHAR(45),
  IN p_celular VARCHAR(45),
  IN p_direccion VARCHAR(450),
  IN p_activo VARCHAR(1),
  IN p_correo VARCHAR(45),
  IN p_ruc VARCHAR(45),
  IN p_doc_ident VARCHAR(45),
  IN p_dig_verificador VARCHAR(1),
  IN p_obs VARCHAR(450),
  IN p_estado_civil VARCHAR(45),
  IN p_fec_nac DATE,
  IN p_tipo_doc INT
)
BEGIN
  UPDATE gen_persona
     SET PER_NOMBRE = p_nombre,
         PER_APELLIDO = p_apellido,
         PER_TELEFONO = p_telefono,
         PER_CELULAR = p_celular,
         PER_DIRECCION = p_direccion,
         PER_ACTIVO = p_activo,
         PER_CORREO = p_correo,
         PER_RUC = p_ruc,
         PER_DOC_IDENT = p_doc_ident,
         PER_DIG_VERIFICADOR = p_dig_verificador,
         PER_OBS = p_obs,
         PER_ESTADO_CIVIL = p_estado_civil,
         PER_FEC_NAC = p_fec_nac,
         PER_TIPO_DOC = p_tipo_doc
   WHERE PER_CODIGO = p_codigo;

  CALL sp_gen_persona_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_persona_delete $$
CREATE PROCEDURE sp_gen_persona_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_persona_a_gen_tpo_persona
   WHERE GEN_PERSONA = p_codigo;

  DELETE FROM gen_persona
   WHERE PER_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_gen_persona_add_tipo $$
CREATE PROCEDURE sp_gen_persona_add_tipo(
  IN p_persona INT,
  IN p_tipo INT
)
BEGIN
  INSERT IGNORE INTO gen_persona_a_gen_tpo_persona (GEN_TPO_PERSONA, GEN_PERSONA)
  VALUES (p_tipo, p_persona);

  CALL sp_gen_persona_get(p_persona);
END $$

DROP PROCEDURE IF EXISTS sp_gen_persona_remove_tipo $$
CREATE PROCEDURE sp_gen_persona_remove_tipo(
  IN p_persona INT,
  IN p_tipo INT
)
BEGIN
  DELETE FROM gen_persona_a_gen_tpo_persona
   WHERE GEN_PERSONA = p_persona
     AND GEN_TPO_PERSONA = p_tipo;

  CALL sp_gen_persona_get(p_persona);
END $$

-- =====================================================
-- Empresas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_empresa_list $$
CREATE PROCEDURE sp_gen_empresa_list()
BEGIN
  SELECT EMPR_CODIGO,
         EMPR_RAZON_SOCIAL,
         EMPR_RUC,
         EMPR_TELEFONO,
         EMPR_CELULAR,
         EMPR_DIRECCION,
         EMPR_LOGO
    FROM gen_empresa
   ORDER BY EMPR_RAZON_SOCIAL;
END $$

DROP PROCEDURE IF EXISTS sp_gen_empresa_get $$
CREATE PROCEDURE sp_gen_empresa_get(IN p_codigo INT)
BEGIN
  SELECT EMPR_CODIGO,
         EMPR_RAZON_SOCIAL,
         EMPR_RUC,
         EMPR_TELEFONO,
         EMPR_CELULAR,
         EMPR_DIRECCION,
         EMPR_LOGO
    FROM gen_empresa
   WHERE EMPR_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_empresa_create $$
CREATE PROCEDURE sp_gen_empresa_create(
  IN p_razon_social VARCHAR(450),
  IN p_ruc VARCHAR(45),
  IN p_telefono VARCHAR(45),
  IN p_celular VARCHAR(45),
  IN p_direccion VARCHAR(450),
  IN p_logo VARCHAR(450)
)
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(EMPR_CODIGO), 0) + 1
    INTO v_codigo
    FROM gen_empresa;

  INSERT INTO gen_empresa (
    EMPR_CODIGO,
    EMPR_RAZON_SOCIAL,
    EMPR_RUC,
    EMPR_TELEFONO,
    EMPR_CELULAR,
    EMPR_DIRECCION,
    EMPR_LOGO
  ) VALUES (
    v_codigo,
    p_razon_social,
    p_ruc,
    NULLIF(p_telefono, ''),
    p_celular,
    p_direccion,
    NULLIF(p_logo, '')
  );

  CALL sp_gen_empresa_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_empresa_update $$
CREATE PROCEDURE sp_gen_empresa_update(
  IN p_codigo INT,
  IN p_razon_social VARCHAR(450),
  IN p_ruc VARCHAR(45),
  IN p_telefono VARCHAR(45),
  IN p_celular VARCHAR(45),
  IN p_direccion VARCHAR(450),
  IN p_logo VARCHAR(450)
)
BEGIN
  UPDATE gen_empresa
     SET EMPR_RAZON_SOCIAL = p_razon_social,
         EMPR_RUC = p_ruc,
         EMPR_TELEFONO = NULLIF(p_telefono, ''),
         EMPR_CELULAR = p_celular,
         EMPR_DIRECCION = p_direccion,
         EMPR_LOGO = NULLIF(p_logo, '')
   WHERE EMPR_CODIGO = p_codigo;

  CALL sp_gen_empresa_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_empresa_delete $$
CREATE PROCEDURE sp_gen_empresa_delete(IN p_codigo INT)
BEGIN
  DELETE FROM gen_empresa
   WHERE EMPR_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Motivos
-- =====================================================
DROP PROCEDURE IF EXISTS sp_gen_motivo_list $$
CREATE PROCEDURE sp_gen_motivo_list()
BEGIN
  SELECT MOT_CODIGO,
         MOT_DESC
    FROM GEN_MOTIVO
   ORDER BY MOT_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_gen_motivo_get $$
CREATE PROCEDURE sp_gen_motivo_get(IN p_codigo INT)
BEGIN
  SELECT MOT_CODIGO,
         MOT_DESC
    FROM GEN_MOTIVO
   WHERE MOT_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_gen_motivo_create $$
CREATE PROCEDURE sp_gen_motivo_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(MOT_CODIGO), 0) + 1
    INTO v_codigo
    FROM GEN_MOTIVO;

  INSERT INTO GEN_MOTIVO (MOT_CODIGO, MOT_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_gen_motivo_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_motivo_update $$
CREATE PROCEDURE sp_gen_motivo_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE GEN_MOTIVO
     SET MOT_DESC = p_desc
   WHERE MOT_CODIGO = p_codigo;

  CALL sp_gen_motivo_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_gen_motivo_delete $$
CREATE PROCEDURE sp_gen_motivo_delete(IN p_codigo INT)
BEGIN
  DELETE FROM GEN_MOTIVO
   WHERE MOT_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Cajas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_fin_caja_list $$
CREATE PROCEDURE sp_fin_caja_list()
BEGIN
  SELECT CAJ_CODIGO,
         CAJ_DESC
    FROM fin_caja
   ORDER BY CAJ_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_fin_caja_get $$
CREATE PROCEDURE sp_fin_caja_get(IN p_codigo INT)
BEGIN
  SELECT CAJ_CODIGO,
         CAJ_DESC
    FROM fin_caja
   WHERE CAJ_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_fin_caja_create $$
CREATE PROCEDURE sp_fin_caja_create(IN p_desc VARCHAR(450))
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(CAJ_CODIGO), 0) + 1
    INTO v_codigo
    FROM fin_caja;

  INSERT INTO fin_caja (CAJ_CODIGO, CAJ_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_fin_caja_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_fin_caja_update $$
CREATE PROCEDURE sp_fin_caja_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(450)
)
BEGIN
  UPDATE fin_caja
     SET CAJ_DESC = p_desc
   WHERE CAJ_CODIGO = p_codigo;

  CALL sp_fin_caja_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_fin_caja_delete $$
CREATE PROCEDURE sp_fin_caja_delete(IN p_codigo INT)
BEGIN
  DELETE FROM fin_caja
   WHERE CAJ_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

-- =====================================================
-- Cajas por usuario
-- =====================================================
DROP PROCEDURE IF EXISTS sp_fin_caj_a_user_list $$
CREATE PROCEDURE sp_fin_caj_a_user_list()
BEGIN
  SELECT rel.CAJU_CAJA,
         rel.CAJU_USUARIO,
         caja.CAJ_DESC,
         usuario.USER_USUARIO,
         usuario.USER_NOMBRE,
         usuario.USER_APELLIDO
    FROM fin_caj_a_user rel
    JOIN fin_caja caja
      ON caja.CAJ_CODIGO = rel.CAJU_CAJA
    JOIN gen_usuario usuario
      ON usuario.USER_CODIGO = rel.CAJU_USUARIO
   ORDER BY caja.CAJ_DESC, usuario.USER_USUARIO;
END $$

DROP PROCEDURE IF EXISTS sp_fin_caj_a_user_create $$
CREATE PROCEDURE sp_fin_caj_a_user_create(
  IN p_caja INT,
  IN p_usuario INT
)
BEGIN
  INSERT IGNORE INTO fin_caj_a_user (CAJU_CAJA, CAJU_USUARIO)
  VALUES (p_caja, p_usuario);

  CALL sp_fin_caj_a_user_list();
END $$

DROP PROCEDURE IF EXISTS sp_fin_caj_a_user_delete $$
CREATE PROCEDURE sp_fin_caj_a_user_delete(
  IN p_caja INT,
  IN p_usuario INT
)
BEGIN
  DELETE FROM fin_caj_a_user
   WHERE CAJU_CAJA = p_caja
     AND CAJU_USUARIO = p_usuario;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_gen_usuario_basic_list $$
CREATE PROCEDURE sp_gen_usuario_basic_list()
BEGIN
  SELECT USER_CODIGO,
         USER_USUARIO,
         USER_NOMBRE,
         USER_APELLIDO,
         USER_ESTADO
    FROM gen_usuario
   ORDER BY USER_USUARIO;
END $$

-- =====================================================
-- Dispositivos
-- =====================================================
DROP PROCEDURE IF EXISTS sp_stk_dispositivo_list $$
CREATE PROCEDURE sp_stk_dispositivo_list()
BEGIN
  SELECT dis.DIS_CODIGO,
         dis.DIS_DESC,
         dis.DIS_MODELO,
         modelo.MOD_DESC,
         dis.DIS_MARCA,
         marca.MAR_DESC,
         dis.DIS_RAM,
         dis.DIS_ROM
    FROM STK_DISPOSITIVO dis
    JOIN STK_MODELO modelo
      ON modelo.MOD_CODIGO = dis.DIS_MODELO
    JOIN stk_marca marca
      ON marca.MAR_CODIGO = dis.DIS_MARCA
   ORDER BY dis.DIS_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_stk_dispositivo_get $$
CREATE PROCEDURE sp_stk_dispositivo_get(IN p_codigo INT)
BEGIN
  SELECT dis.DIS_CODIGO,
         dis.DIS_DESC,
         dis.DIS_MODELO,
         modelo.MOD_DESC,
         dis.DIS_MARCA,
         marca.MAR_DESC,
         dis.DIS_RAM,
         dis.DIS_ROM
    FROM STK_DISPOSITIVO dis
    JOIN STK_MODELO modelo
      ON modelo.MOD_CODIGO = dis.DIS_MODELO
    JOIN stk_marca marca
      ON marca.MAR_CODIGO = dis.DIS_MARCA
   WHERE dis.DIS_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_stk_dispositivo_create $$
CREATE PROCEDURE sp_stk_dispositivo_create(
  IN p_desc VARCHAR(450),
  IN p_modelo INT,
  IN p_marca INT,
  IN p_ram INT,
  IN p_rom INT
)
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(DIS_CODIGO), 0) + 1
    INTO v_codigo
    FROM STK_DISPOSITIVO;

  INSERT INTO STK_DISPOSITIVO (
    DIS_CODIGO,
    DIS_DESC,
    DIS_MODELO,
    DIS_MARCA,
    DIS_RAM,
    DIS_ROM
  ) VALUES (
    v_codigo,
    p_desc,
    p_modelo,
    p_marca,
    p_ram,
    p_rom
  );

  CALL sp_stk_dispositivo_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_dispositivo_update $$
CREATE PROCEDURE sp_stk_dispositivo_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(450),
  IN p_modelo INT,
  IN p_marca INT,
  IN p_ram INT,
  IN p_rom INT
)
BEGIN
  UPDATE STK_DISPOSITIVO
     SET DIS_DESC = p_desc,
         DIS_MODELO = p_modelo,
         DIS_MARCA = p_marca,
         DIS_RAM = p_ram,
         DIS_ROM = p_rom
   WHERE DIS_CODIGO = p_codigo;

  CALL sp_stk_dispositivo_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_dispositivo_delete $$
CREATE PROCEDURE sp_stk_dispositivo_delete(IN p_codigo INT)
BEGIN
  DELETE FROM STK_DISPOSITIVO
   WHERE DIS_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_stk_modelo_list $$
CREATE PROCEDURE sp_stk_modelo_list()
BEGIN
  SELECT MOD_CODIGO,
         MOD_DESC
    FROM STK_MODELO
   ORDER BY MOD_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_stk_modelo_get $$
CREATE PROCEDURE sp_stk_modelo_get(IN p_codigo INT)
BEGIN
  SELECT MOD_CODIGO,
         MOD_DESC
    FROM STK_MODELO
   WHERE MOD_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_stk_modelo_create $$
CREATE PROCEDURE sp_stk_modelo_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(MOD_CODIGO), 0) + 1
    INTO v_codigo
    FROM STK_MODELO;

  INSERT INTO STK_MODELO (MOD_CODIGO, MOD_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_stk_modelo_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_modelo_update $$
CREATE PROCEDURE sp_stk_modelo_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE STK_MODELO
     SET MOD_DESC = p_desc
   WHERE MOD_CODIGO = p_codigo;

  CALL sp_stk_modelo_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_modelo_delete $$
CREATE PROCEDURE sp_stk_modelo_delete(IN p_codigo INT)
BEGIN
  DELETE FROM STK_MODELO
   WHERE MOD_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_stk_marca_list $$
CREATE PROCEDURE sp_stk_marca_list()
BEGIN
  SELECT MAR_CODIGO,
         MAR_DESC
    FROM stk_marca
   ORDER BY MAR_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_stk_marca_get $$
CREATE PROCEDURE sp_stk_marca_get(IN p_codigo INT)
BEGIN
  SELECT MAR_CODIGO,
         MAR_DESC
    FROM stk_marca
   WHERE MAR_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_stk_marca_create $$
CREATE PROCEDURE sp_stk_marca_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(MAR_CODIGO), 0) + 1
    INTO v_codigo
    FROM stk_marca;

  INSERT INTO stk_marca (MAR_CODIGO, MAR_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_stk_marca_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_marca_update $$
CREATE PROCEDURE sp_stk_marca_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE stk_marca
     SET MAR_DESC = p_desc
   WHERE MAR_CODIGO = p_codigo;

  CALL sp_stk_marca_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_marca_delete $$
CREATE PROCEDURE sp_stk_marca_delete(IN p_codigo INT)
BEGIN
  DELETE FROM stk_marca
   WHERE MAR_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_stk_grupo_list $$
CREATE PROCEDURE sp_stk_grupo_list()
BEGIN
  SELECT GRU_CODIGO,
         GRU_DESC
    FROM stk_grupo
   ORDER BY GRU_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_stk_grupo_get $$
CREATE PROCEDURE sp_stk_grupo_get(IN p_codigo INT)
BEGIN
  SELECT GRU_CODIGO,
         GRU_DESC
    FROM stk_grupo
   WHERE GRU_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_stk_grupo_create $$
CREATE PROCEDURE sp_stk_grupo_create(IN p_desc VARCHAR(45))
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(GRU_CODIGO), 0) + 1
    INTO v_codigo
    FROM stk_grupo;

  INSERT INTO stk_grupo (GRU_CODIGO, GRU_DESC)
  VALUES (v_codigo, p_desc);

  CALL sp_stk_grupo_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_grupo_update $$
CREATE PROCEDURE sp_stk_grupo_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45)
)
BEGIN
  UPDATE stk_grupo
     SET GRU_DESC = p_desc
   WHERE GRU_CODIGO = p_codigo;

  CALL sp_stk_grupo_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_grupo_delete $$
CREATE PROCEDURE sp_stk_grupo_delete(IN p_codigo INT)
BEGIN
  DELETE FROM stk_grupo
   WHERE GRU_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_stk_categoria_iva_list $$
CREATE PROCEDURE sp_stk_categoria_iva_list()
BEGIN
  SELECT CAT_CODIGO,
         CAT_DESC,
         CAT_IVA
    FROM stk_categoria_iva
   ORDER BY CAT_DESC;
END $$

DROP PROCEDURE IF EXISTS sp_stk_categoria_iva_get $$
CREATE PROCEDURE sp_stk_categoria_iva_get(IN p_codigo INT)
BEGIN
  SELECT CAT_CODIGO,
         CAT_DESC,
         CAT_IVA
    FROM stk_categoria_iva
   WHERE CAT_CODIGO = p_codigo
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_stk_categoria_iva_create $$
CREATE PROCEDURE sp_stk_categoria_iva_create(
  IN p_desc VARCHAR(45),
  IN p_iva DOUBLE
)
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(CAT_CODIGO), 0) + 1
    INTO v_codigo
    FROM stk_categoria_iva;

  INSERT INTO stk_categoria_iva (CAT_CODIGO, CAT_DESC, CAT_IVA)
  VALUES (v_codigo, p_desc, p_iva);

  CALL sp_stk_categoria_iva_get(v_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_categoria_iva_update $$
CREATE PROCEDURE sp_stk_categoria_iva_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(45),
  IN p_iva DOUBLE
)
BEGIN
  UPDATE stk_categoria_iva
     SET CAT_DESC = p_desc,
         CAT_IVA = p_iva
   WHERE CAT_CODIGO = p_codigo;

  CALL sp_stk_categoria_iva_get(p_codigo);
END $$

DROP PROCEDURE IF EXISTS sp_stk_categoria_iva_delete $$
CREATE PROCEDURE sp_stk_categoria_iva_delete(IN p_codigo INT)
BEGIN
  DELETE FROM stk_categoria_iva
   WHERE CAT_CODIGO = p_codigo;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_stk_item_list $$
CREATE PROCEDURE sp_stk_item_list()
BEGIN
  SELECT item.ITEM_CODIGO,
         item.ITEM_DESC,
         item.ITEM_COD_BARRA,
         item.ITEM_ACTIVO,
         item.ITEM_AFECTA_STOCK,
         item.ITEM_MARCA,
         marca.MAR_DESC,
         item.ITEM_GRUPO,
         grupo.GRU_DESC,
         item.ITEM_CAT_IVA,
         cat.CAT_DESC,
         cat.CAT_IVA,
         item.ITEM_PORC_GANANCIA,
         item.ITEM_IND_DESCUENTO
    FROM stk_item item
    JOIN stk_marca marca ON marca.MAR_CODIGO = item.ITEM_MARCA
    JOIN stk_grupo grupo ON grupo.GRU_CODIGO = item.ITEM_GRUPO
    JOIN stk_categoria_iva cat ON cat.CAT_CODIGO = item.ITEM_CAT_IVA
   ORDER BY item.ITEM_DESC;
END $$


-- ===========================================
-- OBTENER UN ITEM POR CÓDIGO
-- ===========================================
DROP PROCEDURE IF EXISTS sp_stk_item_get $$
CREATE PROCEDURE sp_stk_item_get(IN p_codigo INT)
BEGIN
  SELECT item.ITEM_CODIGO,
         item.ITEM_DESC,
         item.ITEM_COD_BARRA,
         item.ITEM_ACTIVO,
         item.ITEM_AFECTA_STOCK,
         item.ITEM_MARCA,
         marca.MAR_DESC,
         item.ITEM_GRUPO,
         grupo.GRU_DESC,
         item.ITEM_CAT_IVA,
         cat.CAT_DESC,
         cat.CAT_IVA,
         item.ITEM_PORC_GANANCIA,
         item.ITEM_IND_DESCUENTO
    FROM stk_item item
    JOIN stk_marca marca ON marca.MAR_CODIGO = item.ITEM_MARCA
    JOIN stk_grupo grupo ON grupo.GRU_CODIGO = item.ITEM_GRUPO
    JOIN stk_categoria_iva cat ON cat.CAT_CODIGO = item.ITEM_CAT_IVA
   WHERE item.ITEM_CODIGO = p_codigo
   LIMIT 1;
END $$


-- ===========================================
-- CREAR UN NUEVO ITEM
-- ===========================================
DROP PROCEDURE IF EXISTS sp_stk_item_create $$
CREATE PROCEDURE sp_stk_item_create(
  IN p_desc VARCHAR(200),
  IN p_codigo_barra VARCHAR(200),
  IN p_activo VARCHAR(1),
  IN p_afecta_stock VARCHAR(1),
  IN p_marca INT,
  IN p_grupo INT,
  IN p_categoria INT,
  IN p_porc_ganancia DOUBLE,
  IN p_ind_descuento VARCHAR(1)
)
BEGIN
  DECLARE v_codigo INT;

  SELECT IFNULL(MAX(ITEM_CODIGO), 0) + 1 INTO v_codigo
    FROM stk_item;

  INSERT INTO stk_item (
    ITEM_CODIGO,
    ITEM_DESC,
    ITEM_COD_BARRA,
    ITEM_ACTIVO,
    ITEM_AFECTA_STOCK,
    ITEM_MARCA,
    ITEM_GRUPO,
    ITEM_CAT_IVA,
    ITEM_PORC_GANANCIA,
    ITEM_IND_DESCUENTO
  ) VALUES (
    v_codigo,
    p_desc,
    NULLIF(p_codigo_barra, ''),
    p_activo,
    p_afecta_stock,
    p_marca,
    p_grupo,
    p_categoria,
    p_porc_ganancia,
    p_ind_descuento
  );

  CALL sp_stk_item_get(v_codigo);
END $$


-- ===========================================
-- ACTUALIZAR UN ITEM EXISTENTE
-- ===========================================
DROP PROCEDURE IF EXISTS sp_stk_item_update $$
CREATE PROCEDURE sp_stk_item_update(
  IN p_codigo INT,
  IN p_desc VARCHAR(200),
  IN p_codigo_barra VARCHAR(200),
  IN p_activo VARCHAR(1),
  IN p_afecta_stock VARCHAR(1),
  IN p_marca INT,
  IN p_grupo INT,
  IN p_categoria INT,
  IN p_porc_ganancia DOUBLE,
  IN p_ind_descuento VARCHAR(1)
)
BEGIN
  UPDATE stk_item
     SET ITEM_DESC = p_desc,
         ITEM_COD_BARRA = NULLIF(p_codigo_barra, ''),
         ITEM_ACTIVO = p_activo,
         ITEM_AFECTA_STOCK = p_afecta_stock,
         ITEM_MARCA = p_marca,
         ITEM_GRUPO = p_grupo,
         ITEM_CAT_IVA = p_categoria,
         ITEM_PORC_GANANCIA = p_porc_ganancia,
         ITEM_IND_DESCUENTO = p_ind_descuento
   WHERE ITEM_CODIGO = p_codigo;

  CALL sp_stk_item_get(p_codigo);
END $$


-- ===========================================
-- ELIMINAR UN ITEM
-- ===========================================
DROP PROCEDURE IF EXISTS sp_stk_item_delete $$
CREATE PROCEDURE sp_stk_item_delete(IN p_codigo INT)
BEGIN
  DELETE FROM stk_item WHERE ITEM_CODIGO = p_codigo;
  SELECT ROW_COUNT() AS affected;
END $$

DELIMITER ;
