@echo off
title FACET - Todos los Servicios

echo ================================================
echo 🚀 INICIANDO TODOS LOS SERVICIOS DE FACET
echo ================================================
echo.

:: Verificar si estamos en el directorio correcto
if not exist "manage.py" (
    echo ❌ Error: manage.py no encontrado
    echo 📌 Ejecuta este script desde el directorio backend/facet/
    pause
    exit /b 1
)

:: Verificar si existe el entorno virtual
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Error: Entorno virtual no encontrado
    echo 📌 Crea el entorno virtual con: python -m venv venv
    pause
    exit /b 1
)

echo 🔧 Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo 📍 Servicios que se van a iniciar:
echo    1. Redis Server (Puerto 6379)
echo    2. Celery Worker (Procesamiento de emails)
echo    3. Celery Beat (Tareas programadas)
echo    4. Django Server (Puerto 8000)
echo.

:: Verificar Redis
echo 🔍 Verificando Redis...
redis-cli ping >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Redis no está ejecutándose
    echo 📌 Inicia Redis primero con: .\start_redis.bat
    echo 📌 O instálalo con: choco install redis-64
    pause
    exit /b 1
) else (
    echo ✅ Redis está corriendo
)

echo.
echo 🚀 Iniciando Celery Worker...
start "FACET - Celery Worker" /min cmd /c "call venv\Scripts\activate.bat && celery -A administracion worker --loglevel=info --pool=solo --concurrency=1"

echo ⏰ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo 🚀 Iniciando Celery Beat...
start "FACET - Celery Beat" /min cmd /c "call venv\Scripts\activate.bat && celery -A administracion beat --loglevel=info --scheduler=django_celery_beat.schedulers:DatabaseScheduler"

echo ⏰ Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo 🚀 Iniciando Django Server...
echo.
echo ✅ Todos los servicios iniciados!
echo 🌐 Django: http://localhost:8000
echo 📊 Para monitorear Celery: pip install flower && celery -A administracion flower
echo.
echo 📌 Para detener: Cierra todas las ventanas o presiona Ctrl+C
echo.

python manage.py runserver 