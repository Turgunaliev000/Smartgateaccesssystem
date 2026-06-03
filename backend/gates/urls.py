from django.urls import path

from . import views


urlpatterns = [
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
    path("me/", views.me_view),
    path("dashboard/", views.dashboard_view),
    path("gate/open/", views.open_gate_view),
    path("guest-passes/", views.guest_passes_view),
    path("scan/", views.scan_guest_pass_view),
    path("access-logs/", views.access_logs_view),
    path("notifications/", views.notifications_view),
    path("notifications/<int:notification_id>/read/", views.notification_read_view),
    path("notifications/read-all/", views.notifications_read_all_view),
    path("notifications/<int:notification_id>/", views.notification_delete_view),
    path("users/", views.users_view),
    path("users/<int:user_id>/toggle/", views.user_toggle_view),
]
