from django.contrib import admin

from .models import AccessLog, AccessUser, Gate, GuestPass, Notification


@admin.register(AccessUser)
class AccessUserAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "user_type", "is_active", "is_admin", "access_count")
    search_fields = ("full_name", "email", "identifier")
    list_filter = ("user_type", "is_active", "is_admin")


@admin.register(Gate)
class GateAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "is_open", "last_opened_at", "opened_until")


@admin.register(GuestPass)
class GuestPassAdmin(admin.ModelAdmin):
    list_display = ("guest_name", "vehicle_plate", "guest_phone", "reason", "host", "valid_until", "is_used", "created_at")
    search_fields = ("guest_name", "vehicle_plate", "guest_phone", "code", "host__full_name")
    list_filter = ("reason", "is_used")


@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ("subject_name", "subject_type", "action", "success", "gate", "created_at")
    search_fields = ("subject_name",)
    list_filter = ("subject_type", "action", "success")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
