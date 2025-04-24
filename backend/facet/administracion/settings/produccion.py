import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

allowed_hosts = os.environ.get("DJANGO_ALLOWED_HOSTS")
ALLOWED_HOSTS = allowed_hosts.split(',') if allowed_hosts else []
print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")

# CORS
cors_allowed_origins = os.environ.get("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGINS = cors_allowed_origins.split(',') if cors_allowed_origins else []
print(f"CORS_ALLOWED_ORIGINS: {CORS_ALLOWED_ORIGINS}")

cors_origin_whitelist = os.environ.get("CORS_ORIGIN_WHITELIST")
CORS_ORIGIN_WHITELIST = cors_origin_whitelist.split(',') if cors_origin_whitelist else []

CORS_ALLOW_CREDENTIALS = True

csrf_trusted_origins = os.environ.get("CSRF_TRUSTED_ORIGINS")
CSRF_TRUSTED_ORIGINS = csrf_trusted_origins.split(',') if csrf_trusted_origins else []
print(f"CSRF_TRUSTED_ORIGINS: {CSRF_TRUSTED_ORIGINS}")

MIDDLEWARE += [
    # 'whitenoise.middleware.WhiteNoiseMiddleware',
]

REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ),
    "DEFAULT_PARSER_CLASSES": ("rest_framework.parsers.JSONParser","rest_framework.parsers.FormParser", "rest_framework.parsers.MultiPartParser"),  # Parser JSON
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",  # Renderizador JSON
        'rest_framework.renderers.BrowsableAPIRenderer',  # Comenta o elimina esta línea para deshabilitar el renderizador HTML
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 10,
    "DATETIME_FORMAT": "%d/%m/%Y %H:%M:%S",
    "DATE_FORMAT": "%d/%m/%Y",
}

CORS_ORIGIN_WHITELIST = [
    'https://docentes.facet.unt.edu.ar/api',
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_EXPOSE_HEADERS = [
    "content-type",
    "x-csrftoken",
]

'''

CORS_ALLOW_CREDENTIALS = True
# Seguridad (CSRF, SSL, etc.)
CSRF_TRUSTED_ORIGINS = ['https://docentes.facet.unt.edu.ar/api']

'''

CSRF_COOKIE_SECURE = False  # Requiere HTTPS
CSRF_COOKIE_HTTPONLY = False  # Permite acceso desde JS, document.cookie
CSRF_COOKIE_SAMESITE = "Lax"  # O "None" si frontend y backend están en dominios distintos