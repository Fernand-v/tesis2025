# Jasper Report Service

Este módulo encapsula el servicio de generación de reportes basado en JasperReports que consume la aplicación. A continuación se detalla la estructura del directorio, la configuración relevante y las formas recomendadas de ponerlo en marcha.

## Estructura

- `jasperServer/report-service-1.0.0.jar`: binario empaquetado del servicio de reportes.
- `jasperServer/application.properties`: configuración de Spring Boot y la conexión a la base de datos.
- `jasperServer/templates/`: carpeta donde se almacenan los archivos `.jasper` compilados que el servicio expone.

## Configuración

Los parámetros principales se encuentran en `jasperServer/application.properties`:

| Propiedad | Descripción |
| --- | --- |
| `server.port` | Puerto HTTP donde se expone el servicio (por defecto `5555`). |
| `reports.dir` | Directorio relativo que contiene los templates Jasper compilados. |
| `spring.datasource.url` | Cadena de conexión hacia la base de datos utilizada por los reportes. |
| `spring.datasource.username` / `spring.datasource.password` | Credenciales para acceder a la base de datos. |
| `spring.datasource.hikari.maximum-pool-size` | Tamaño máximo del pool de conexiones (HikariCP). |

> ⚠️ Ajusta las credenciales y el host de base de datos antes de desplegar en otros entornos.

## Puesta en marcha

### Opción recomendada (todo en uno)

Desde la raíz del proyecto ejecuta:

```bash
./start-all.sh
```

El script realiza lo siguiente:

1. Verifica que existan las dependencias de `cliente` y `server` (las instala si faltan).
2. Levanta el front-end (`npm run dev` en `cliente/`).
3. Arranca la API (`npm run dev` en `server/`).
4. Ejecuta el servicio Jasper con la configuración indicada.
5. Mantiene los procesos en primer plano hasta que se presione `Ctrl+C`, gestionando su apagado ordenado.

### Ejecución manual del servicio Jasper

Si solo necesitas el servicio de reportes, navega a `jasperServer/` y ejecuta:

```bash
java -jar report-service-1.0.0.jar --spring.config.location=application.properties
```

## Incorporación de nuevos reportes

1. Diseña y compila el reporte en JasperSoft Studio u otra herramienta compatible, generando el `.jasper` correspondiente.
2. Copia el archivo compilado dentro de `jasperServer/templates/`.
3. Reinicia el servicio Jasper para que el nuevo template quede disponible.

Mantén los nombres de los archivos acordes al contrato utilizado por la API para solicitar cada reporte.

## Requisitos

- Java 17 o superior disponible en el `PATH`.
- Acceso a la base de datos configurada en `application.properties`.
- Node.js 18+ (solo si se utiliza `start-all.sh` para levantar cliente y servidor).
