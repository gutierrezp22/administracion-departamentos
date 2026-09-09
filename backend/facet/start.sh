#!/bin/sh
# Arranque del backend en Coolify/Nixpacks.
#
# Las migraciones se aplican ACA, dentro del contenedor nuevo, y no en el
# "Pre-deployment Command" de Coolify: ese corre en el contenedor VIEJO, con
# el codigo anterior, asi que el deploy queda en "Success" con la base sin
# migrar (fue lo que dejo la 0013 sin aplicar y rompio persona/tipo-cargo/
# asignatura con "column ... does not exist").
#
# `set -e` es a proposito: si migrate falla, el contenedor no levanta, el
# health check de Coolify falla y se mantiene el contenedor anterior. Es
# preferible a servir la app contra una base a medio migrar.
set -e

PY=/opt/venv/bin/python
[ -x "$PY" ] || PY=python

# manage.py entra por administracion.settings (elige segun ENVIRONMENT) y
# gunicorn por administracion.settings.produccion. Se fuerza el mismo modulo
# en los dos para que migrate y collectstatic corran con los settings reales.

"$PY" manage.py migrate --noinput --settings=administracion.settings.produccion

# Con DEBUG=False Django ya no sirve los estaticos: los sirve WhiteNoise desde
# STATIC_ROOT, y CompressedManifestStaticFilesStorage revienta si el manifest
# no existe. Se corre aca para no depender de que el build lo haya hecho.
"$PY" manage.py collectstatic --noinput --settings=administracion.settings.produccion

exec "$PY" -m gunicorn administracion.wsgi:application --bind 0.0.0.0:8000
