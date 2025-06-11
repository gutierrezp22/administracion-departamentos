@echo off
title Celery Worker - FACET (Solo Worker)

echo ================================================
echo 🚀 INICIANDO CELERY WORKER PARA EMAILS
echo ================================================
echo.

:: Verificar si estamos en el directorio correcto
if not exist "manage.py" (
    echo ❌ Error: manage.py no encontrado
    echo 📌 Ejecuta este script desde el directorio backend/facet/
    pause
    exit /b 1
)

:: Activar entorno virtual
echo 🔧 Activando entorno virtual...
call venv\Scripts\activate.bat

:: Verificar Redis
echo 🔍 Verificando Redis...
D:\Programas\redis\redis-cli.exe ping >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Redis no está ejecutándose
    echo 📌 Inicia Redis primero con: .\start_redis.bat
    pause
    exit /b 1
) else (
    echo ✅ Redis está corriendo
)

:: Crear logs si no existen
if not exist "logs" mkdir logs

echo ✅ Iniciando Celery Worker...
echo 📍 Broker: Redis (localhost:6379)
echo 📊 Colas: celery, emails
echo 📝 Logs: logs/celery_worker.log
echo.
echo 📌 Para detener: Presiona Ctrl+C
echo.

:: Iniciar Worker con TODAS las colas
celery -A administracion worker --loglevel=info --pool=solo --concurrency=2 --queues=celery,emails --logfile=logs/celery_worker.log 