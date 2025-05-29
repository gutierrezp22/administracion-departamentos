#!/usr/bin/env python
"""
Script para probar el funcionamiento del soft delete en todos los ViewSets modificados.
"""

import requests
import json

BASE_URL = "http://localhost:8000/facet"

def test_soft_delete(endpoint, test_data):
    """
    Prueba el soft delete para un endpoint específico.
    
    Args:
        endpoint (str): El endpoint a probar (ej: 'areas')
        test_data (dict): Los datos para crear el objeto de prueba
    """
    print(f"\n{'='*50}")
    print(f"PROBANDO SOFT DELETE EN: {endpoint.upper()}")
    print(f"{'='*50}")
    
    # 1. Crear un objeto
    print("1. Creando objeto de prueba...")
    try:
        response = requests.post(f"{BASE_URL}/{endpoint}/", json=test_data)
        if response.status_code == 201:
            obj_id = response.json()['id']
            print(f"   ✅ Objeto creado con ID: {obj_id}")
        else:
            print(f"   ❌ Error al crear objeto: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    # 2. Verificar que aparece en listados normales
    print("2. Verificando que aparece en listados normales...")
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}/")
        if response.status_code == 200:
            objects = response.json()
            found = any(obj['id'] == obj_id for obj in objects.get('results', objects))
            if found:
                print("   ✅ Objeto encontrado en listado normal")
            else:
                print("   ❌ Objeto NO encontrado en listado normal")
                return False
        else:
            print(f"   ❌ Error al obtener listado: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    # 3. Eliminar el objeto (soft delete)
    print("3. Eliminando objeto (soft delete)...")
    try:
        response = requests.delete(f"{BASE_URL}/{endpoint}/{obj_id}/")
        if response.status_code == 204:
            print("   ✅ Objeto eliminado (soft delete)")
        else:
            print(f"   ❌ Error al eliminar objeto: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    # 4. Verificar que NO aparece en listados normales
    print("4. Verificando que NO aparece en listados normales...")
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}/")
        if response.status_code == 200:
            objects = response.json()
            found = any(obj['id'] == obj_id for obj in objects.get('results', objects))
            if not found:
                print("   ✅ Objeto NO encontrado en listado normal (correcto)")
            else:
                print("   ❌ Objeto AÚN aparece en listado normal (incorrecto)")
                return False
        else:
            print(f"   ❌ Error al obtener listado: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    # 5. Verificar que SÍ aparece con show_all
    print("5. Verificando que SÍ aparece con show_all...")
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}/?show_all=true")
        if response.status_code == 200:
            objects = response.json()
            found = any(obj['id'] == obj_id for obj in objects.get('results', objects))
            if found:
                print("   ✅ Objeto encontrado con show_all=true")
            else:
                print("   ❌ Objeto NO encontrado con show_all=true")
                return False
        else:
            print(f"   ❌ Error al obtener listado con show_all: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    # 6. Verificar que aparece filtrado como inactivo
    print("6. Verificando que aparece filtrado como inactivo...")
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}/?estado=0")
        if response.status_code == 200:
            objects = response.json()
            found = any(obj['id'] == obj_id for obj in objects.get('results', objects))
            if found:
                print("   ✅ Objeto encontrado filtrado por estado=0")
            else:
                print("   ❌ Objeto NO encontrado filtrado por estado=0")
                return False
        else:
            print(f"   ❌ Error al obtener listado filtrado: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    print(f"   🎉 TODAS LAS PRUEBAS PASARON PARA {endpoint.upper()}")
    return True

def main():
    """Ejecuta las pruebas para todos los endpoints modificados."""
    print("INICIANDO PRUEBAS DE SOFT DELETE")
    print("Asegúrate de que el servidor Django esté corriendo en localhost:8000")
    
    # Datos de prueba para cada endpoint
    test_cases = {
        'areas': {'nombre': 'Test Area Soft Delete'},
        'asignaturas': {
            'nombre': 'Test Asignatura',
            'codigo': 'TEST001',
            'estado': '1',
            'tipo': 'Test',
            'modulo': 'Test Module'
        },
        'carreras': {
            'nombre': 'Test Carrera',
            'tipo': 'Grado',
            'planestudio': 'Test Plan',
            'estado': '1'
        },
        'departamentos': {
            'nombre': 'Test Departamento',
            'estado': '1'
        },
        # Agrega más endpoints según necesites probar
    }
    
    results = {}
    
    for endpoint, test_data in test_cases.items():
        try:
            results[endpoint] = test_soft_delete(endpoint, test_data)
        except KeyboardInterrupt:
            print("\n\nPruebas interrumpidas por el usuario.")
            break
        except Exception as e:
            print(f"\n❌ Error inesperado en {endpoint}: {e}")
            results[endpoint] = False
    
    # Resumen final
    print(f"\n{'='*50}")
    print("RESUMEN DE PRUEBAS")
    print(f"{'='*50}")
    
    for endpoint, passed in results.items():
        status = "✅ PASÓ" if passed else "❌ FALLÓ"
        print(f"{endpoint:20} : {status}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    print(f"\nTotal: {total_passed}/{total_tests} pruebas pasaron")
    
    if total_passed == total_tests:
        print("🎉 ¡TODAS LAS PRUEBAS PASARON!")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa la implementación.")

if __name__ == "__main__":
    main() 