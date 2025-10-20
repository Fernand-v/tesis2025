#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="${ROOT_DIR}/cliente"
SERVER_DIR="${ROOT_DIR}/server"
JASPER_DIR="${ROOT_DIR}/jasperServer"
JASPER_JAR="${JASPER_DIR}/report-service-1.0.0.jar"
JASPER_CONFIG="${JASPER_DIR}/application.properties"

# Puerto personalizado para Next.js
CLIENT_PORT=3001

pids=()

cleanup() {
  trap - EXIT INT TERM
  local exit_code=$?
  echo
  echo "[manager] Deteniendo servicios..."
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

ensure_node_modules() {
  local name="$1"
  local dir="$2"
  if [ ! -d "${dir}/node_modules" ]; then
    echo "[manager] Instalando dependencias para ${name}..."
    npm install --prefix "${dir}"
  fi
}

start_service() {
  local label="$1"
  shift
  echo "[manager] Iniciando ${label}..."
  "$@" &
  local pid=$!
  pids+=("${pid}")
  echo "[manager] ${label} iniciado (PID ${pid})."
}

if [ ! -f "${JASPER_JAR}" ]; then
  echo "[manager] No se encontró el archivo ${JASPER_JAR}"
  exit 1
fi

if [ ! -f "${JASPER_CONFIG}" ]; then
  echo "[manager] No se encontró la configuración ${JASPER_CONFIG}"
  exit 1
fi

ensure_node_modules "cliente" "${CLIENT_DIR}"
ensure_node_modules "servidor" "${SERVER_DIR}"

start_service "cliente (puerto ${CLIENT_PORT})" npm run dev --prefix "${CLIENT_DIR}" -- -p "${CLIENT_PORT}"
start_service "servidor" npm run dev --prefix "${SERVER_DIR}"
start_service "jasper" java -jar "${JASPER_JAR}" --spring.config.location="${JASPER_CONFIG}"

echo "[manager] Servicios levantados. Presiona Ctrl+C para detener."
echo "[manager] Cliente Next.js disponible en http://localhost:${CLIENT_PORT}"

for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    status=$?
    echo "[manager] Un servicio finalizó con código ${status}."
    break
  fi
done