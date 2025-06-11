@echo off
title Redis Server for FACET

echo ================================================
echo 🚀 INICIANDO REDIS PARA FACET
echo ================================================
echo.

:: Definir ruta personalizada de Redis
set REDIS_PATH=D:\Programas\redis

:: Verificar si Redis está instalado en la ruta personalizada
if not exist "%REDIS_PATH%\redis-server.exe" (
    echo ❌ Redis no encontrado en %REDIS_PATH%
    echo.
    echo 📌 Para instalar Redis en Windows:
    echo 1. Descarga Redis desde: https://github.com/microsoftarchive/redis/releases
    echo 2. O usa chocolatey: choco install redis-64
    echo 3. O usa scoop: scoop install redis
    echo.
    pause
    exit /b 1
)

:: Iniciar Redis desde la ruta personalizada (sin bind específico)
echo ✅ Iniciando Redis Server desde %REDIS_PATH%
echo 📍 Puerto: 6379
echo 🔗 URL: redis://localhost:6379
echo.
echo 📌 Presiona Ctrl+C para detener Redis
echo.

"%REDIS_PATH%\redis-server.exe" --port 6379 