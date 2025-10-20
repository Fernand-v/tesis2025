-- Procedimientos y funciones auxiliares para manejar usuarios y contrasenas.
-- Ejecutar este script dentro de MySQL antes de usar los endpoints de autenticacion.

USE `tesis2025`;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_hash_password $$
CREATE FUNCTION fn_hash_password(p_username VARCHAR(45), p_password VARCHAR(255))
RETURNS VARCHAR(64)
DETERMINISTIC
BEGIN
  RETURN UPPER(SHA2(CONCAT(p_password, p_username), 256));
END $$

DROP PROCEDURE IF EXISTS sp_register_usuario $$
CREATE PROCEDURE sp_register_usuario(
  IN p_username VARCHAR(45),
  IN p_password VARCHAR(255),
  IN p_nombre VARCHAR(45),
  IN p_apellido VARCHAR(45),
  IN p_correo VARCHAR(45),
  IN p_telefono VARCHAR(45),
  IN p_celular VARCHAR(45),
  IN p_direccion VARCHAR(45),
  IN p_grab INT
)
BEGIN
  DECLARE v_nuevo_codigo INT;
  DECLARE v_hash VARCHAR(64);
  DECLARE v_existe INT DEFAULT 0;

  SELECT COUNT(*)
    INTO v_existe
    FROM gen_usuario
   WHERE USER_USUARIO = p_username;

  IF v_existe > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El usuario ya se encuentra registrado';
  END IF;

  SELECT IFNULL(MAX(USER_CODIGO), 0) + 1
    INTO v_nuevo_codigo
    FROM gen_usuario;

  SET v_hash = fn_hash_password(p_username, p_password);

  INSERT INTO gen_usuario (
    USER_CODIGO,
    USER_USUARIO,
    USER_CLAVE,
    USER_FEC_GRAB,
    USER_GRAB,
    USER_ROL,
    USER_NOMBRE,
    USER_APELLIDO,
    USER_TELEFONO,
    USER_CELULAR,
    USER_DIRECCION,
    USER_CORREO,
    USER_ESTADO
  )
  VALUES (
    v_nuevo_codigo,
    p_username,
    v_hash,
    NOW(),
    p_grab,
    0,
    p_nombre,
    p_apellido,
    p_telefono,
    p_celular,
    p_direccion,
    p_correo,
    1
  );

  SELECT
    USER_CODIGO,
    USER_USUARIO,
    USER_NOMBRE,
    USER_APELLIDO,
    USER_CORREO,
    USER_TELEFONO,
    USER_CELULAR,
    USER_DIRECCION,
    USER_ROL,
    USER_ESTADO
  FROM gen_usuario
  WHERE USER_CODIGO = v_nuevo_codigo;
END $$

DROP PROCEDURE IF EXISTS sp_login_usuario $$
CREATE PROCEDURE sp_login_usuario(
  IN p_username VARCHAR(45),
  IN p_password VARCHAR(255)
)
BEGIN
  DECLARE v_hash VARCHAR(64);

  SET v_hash = fn_hash_password(p_username, p_password);

  SELECT
    USER_CODIGO,
    USER_USUARIO,
    USER_NOMBRE,
    USER_APELLIDO,
    USER_CORREO,
    USER_TELEFONO,
    USER_CELULAR,
    USER_DIRECCION,
    USER_ROL,
    USER_ESTADO
  FROM gen_usuario
  WHERE USER_USUARIO = p_username
    AND USER_CLAVE = v_hash
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_perfil_usuario $$
CREATE PROCEDURE sp_perfil_usuario(
  IN p_usuario_codigo INT
)
BEGIN
  SELECT
    USER_CODIGO,
    USER_USUARIO,
    USER_NOMBRE,
    USER_APELLIDO,
    USER_CORREO,
    USER_TELEFONO,
    USER_CELULAR,
    USER_DIRECCION,
    USER_ROL,
    USER_ESTADO
  FROM gen_usuario
  WHERE USER_CODIGO = p_usuario_codigo
  LIMIT 1;

  SELECT
    prg.PRG_CODIGO,
    prg.PRG_DESC,
    prg.PRG_UBICACION,
    prg.PRG_FORMULARIO,
    prg.PRG_TPO_PROG,
    tipo.TPRO_DESC
  FROM gen_usuario usr
  JOIN gen_prog_a_rol rel
    ON rel.PRGU_ROL = usr.USER_ROL
  JOIN gen_programa prg
    ON prg.PRG_CODIGO = rel.PRGU_PROGRAMA
  LEFT JOIN gen_tpo_programa tipo
    ON tipo.TPRO_CODIGO = prg.PRG_TPO_PROG
  WHERE usr.USER_CODIGO = p_usuario_codigo
    AND prg.PRG_HABILITADO = 1;
END $$

DROP PROCEDURE IF EXISTS sp_update_password $$
CREATE PROCEDURE sp_update_password(
  IN p_usuario_codigo INT,
  IN p_username VARCHAR(45),
  IN p_nueva_clave VARCHAR(255)
)
BEGIN
  UPDATE gen_usuario
     SET USER_CLAVE = fn_hash_password(p_username, p_nueva_clave)
   WHERE USER_CODIGO = p_usuario_codigo;
END $$

DELIMITER ;
