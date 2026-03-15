from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/academic/', include('academic.urls')),
    path('api/public/', include('public.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve Vite build assets
FRONTEND_DIR = settings.BASE_DIR.parent / 'frontend' / 'dist'

def serve_frontend_assets(request, path):
    """Serve static assets from the Vite build."""
    return serve(request, path, document_root=str(FRONTEND_DIR / 'assets'))

def serve_frontend_static(request, path):
    """Serve root-level static files from dist folder (like vite.svg)."""
    return serve(request, path, document_root=str(FRONTEND_DIR))

urlpatterns += [
    # Serve Vite assets
    re_path(r'^assets/(?P<path>.*)$', serve_frontend_assets),
    # Serve root-level static files (vite.svg, favicon, etc.)
    re_path(r'^(?P<path>vite\.svg)$', serve_frontend_static),
    # Catch-all for SPA - must be last
    re_path(r'^(?!admin|api).*$', TemplateView.as_view(template_name='index.html'), name='frontend'),
]
