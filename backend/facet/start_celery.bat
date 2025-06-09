@echo off
title Celery Worker & Beat for FACET

echo ================================================
echo 🚀 INICIANDO CELERY PARA FACET
echo ================================================
echo.

:: Verificar si estamos en el directorio correcto
if not exist "manage.py" (
    echo ❌ Error: manage.py no encontrado
    echo 📌 Ejecuta este script desde el directorio backend/facet/
    pause
    exit /b 1
)

:: Verificar y activar entorno virtual
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Error: Entorno virtual no encontrado
    echo 📌 Crea el entorno virtual con: python -m venv venv
    echo 📌 E instala dependencias con: pip install -r requirements.txt
    pause
    exit /b 1
)

echo 🔧 Activando entorno virtual...
call venv\Scripts\activate.bat

:: Verificar que Celery esté instalado
python -c "import celery" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Celery no está instalado
    echo 📌 Instala con: pip install celery redis django-celery-beat django-celery-results
    pause
    exit /b 1
)

:: Crear archivos de log si no existen
if not exist "logs" mkdir logs

echo ✅ Iniciando Celery Worker...
echo 📍 Broker: Redis (localhost:6379)
echo 📊 Logs: logs/celery.log
echo.
echo 📌 Para detener: Presiona Ctrl+C
echo.

:: Iniciar Celery Worker con configuración para Windows
start "Celery Worker" /min celery -A administracion worker --loglevel=info --pool=solo --concurrency=1

:: Esperar un poco y luego iniciar Beat
timeout /t 3 /nobreak >nul

echo ⏰ Iniciando Celery Beat...
celery -A administracion beat --loglevel=info --scheduler=django_celery_beat.schedulers:DatabaseScheduler 