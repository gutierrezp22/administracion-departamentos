#!/usr/bin/env python3
"""
Script para iniciar Celery Worker y Beat de forma conjunta
"""
import os
import sys
import subprocess
import signal
import threading
import time
from pathlib import Path

# Agregar el directorio base al path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'administracion.settings')

def start_worker():
    """Inicia el worker de Celery"""
    print("🚀 Iniciando Celery Worker...")
    subprocess.run([
        'celery', '-A', 'administracion', 'worker', 
        '--loglevel=info',
        '--concurrency=2',
        '--pool=threads'  # Usar threads en Windows
    ], cwd=str(BASE_DIR))

def start_beat():
    """Inicia el scheduler de Celery (Beat)"""
    print("⏰ Iniciando Celery Beat...")
    subprocess.run([
        'celery', '-A', 'administracion', 'beat', 
        '--loglevel=info',
        '--scheduler=django_celery_beat.schedulers:DatabaseScheduler'
    ], cwd=str(BASE_DIR))

def main():
    """Función principal"""
    print("=" * 50)
    print("🎯 INICIANDO CELERY PARA FACET")
    print("=" * 50)
    
    try:
        # Crear threads para worker y beat
        worker_thread = threading.Thread(target=start_worker, daemon=True)
        beat_thread = threading.Thread(target=start_beat, daemon=True)
        
        # Iniciar ambos procesos
        worker_thread.start()
        time.sleep(2)  # Esperar un poco antes de iniciar beat
        beat_thread.start()
        
        print("\n✅ Celery Worker y Beat iniciados correctamente")
        print("📌 Presiona Ctrl+C para detener")
        
        # Mantener el script corriendo
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo Celery...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 