@echo off
title Celery Worker - FACET PRODUCCION

echo ================================================
echo 🚀 INICIANDO CELERY WORKER - PRODUCCION
echo ================================================
echo.

:: Activar entorno virtual
echo 🔧 Activando entorno virtual...
call venv\Scripts\activate.bat

:: Verificar Redis
echo 🔍 Verificando Redis...
redis-cli ping >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Redis no está ejecutándose
    echo 📌 Inicia Redis primero
    pause
    exit /b 1
) else (
    echo ✅ Redis está corriendo
)

:: Crear logs si no existen
if not exist "logs" mkdir logs

echo ✅ Iniciando Celery Worker PRODUCCION...
echo 📍 Broker: Redis
echo 📊 Worker: facet-worker-1
echo 📝 Logs: logs/celery_prod.log
echo.

:: Iniciar Worker con nombre personalizado
celery -A administracion worker --loglevel=info --pool=solo --concurrency=2 --queues=celery,emails --hostname=facet-worker-1@%%h --logfile=logs/celery_prod.log 