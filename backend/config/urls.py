from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import include, path, re_path
from django.views.static import serve


def react_app(request, path=""):
    index_path = settings.BASE_DIR / "dist" / "index.html"
    if not index_path.exists():
        raise Http404("Frontend build not found. Run npm run build first.")
    return FileResponse(index_path.open("rb"), content_type="text/html")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("backend.gates.urls")),
    re_path(r"^assets/(?P<path>.*)$", serve, {"document_root": settings.BASE_DIR / "dist" / "assets"}),
    re_path(
        r"^(?P<path>manifest\.webmanifest|sw\.js|pwa-icon\.svg|pwa-icon-192\.png|pwa-icon-512\.png|install-guide-phones\.png)$",
        serve,
        {"document_root": settings.BASE_DIR / "dist"},
    ),
    path("", react_app),
    re_path(r"^(?P<path>login|register|forgot-password|guest-qr|scanner|history|notifications|profile|admin-panel)/?$", react_app),
]
