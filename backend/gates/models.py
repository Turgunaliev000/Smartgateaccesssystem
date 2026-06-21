import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class AccessUser(models.Model):
    STUDENT = "student"
    STAFF = "staff"
    SECURITY = "security"
    ADMIN = "admin"
    USER_TYPES = [
        (STUDENT, "Студент"),
        (STAFF, "Преподаватель"),
        (SECURITY, "Охрана"),
        (ADMIN, "Администратор"),
    ]

    full_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=40, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default=STUDENT)
    department = models.CharField(max_length=120, blank=True)
    identifier = models.CharField(max_length=40, unique=True)
    password_hash = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    access_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        if not self.password_hash:
            return True
        return check_password(raw_password, self.password_hash)


class PasswordResetCode(models.Model):
    user = models.ForeignKey(AccessUser, on_delete=models.CASCADE, related_name="password_reset_codes")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now() and self.attempts < 5

    def set_code(self, raw_code):
        self.code_hash = make_password(raw_code)

    def check_code(self, raw_code):
        return check_password(raw_code, self.code_hash)


class Gate(models.Model):
    name = models.CharField(max_length=80)
    location = models.CharField(max_length=160)
    is_open = models.BooleanField(default=False)
    opened_until = models.DateTimeField(null=True, blank=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class GuestPass(models.Model):
    ONE_TIME = "one_time"
    MULTIPLE = "multiple"
    PASS_TYPES = [
        (ONE_TIME, "Одноразовый"),
        (MULTIPLE, "Многоразовый"),
    ]

    REASONS = [
        ("meeting", "Встреча с сотрудником"),
        ("delivery", "Доставка"),
        ("event", "Мероприятие"),
        ("interview", "Собеседование"),
        ("maintenance", "Техническое обслуживание"),
        ("other", "Другое"),
    ]

    code = models.CharField(max_length=80, unique=True, default=secrets.token_urlsafe)
    guest_name = models.CharField(max_length=120)
    guest_phone = models.CharField(max_length=40, blank=True)
    vehicle_plate = models.CharField(max_length=30, blank=True)
    comment = models.TextField(blank=True)
    reason = models.CharField(max_length=30, choices=REASONS)
    host = models.ForeignKey(AccessUser, on_delete=models.CASCADE, related_name="guest_passes")
    valid_until = models.DateTimeField()
    pass_type = models.CharField(max_length=20, choices=PASS_TYPES, default=ONE_TIME)
    usage_count = models.PositiveIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self):
        return self.valid_until < timezone.now()

    @property
    def status(self):
        if self.pass_type == self.ONE_TIME and self.is_used:
            return "used"
        if self.is_expired:
            return "expired"
        return "active"

    def __str__(self):
        return f"{self.guest_name} ({self.code})"


class AccessLog(models.Model):
    OPEN = "open"
    QR = "qr"
    DENIED = "denied"
    ACTIONS = [(OPEN, "Открыт"), (QR, "QR-код"), (DENIED, "Отказ")]

    STUDENT = "student"
    STAFF = "staff"
    GUEST = "guest"
    SECURITY = "security"
    ADMIN = "admin"
    SUBJECT_TYPES = [
        (STUDENT, "Студент"),
        (STAFF, "Преподаватель"),
        (GUEST, "Гость"),
        (SECURITY, "Охрана"),
        (ADMIN, "Администратор"),
    ]

    gate = models.ForeignKey(Gate, on_delete=models.CASCADE, related_name="logs")
    user = models.ForeignKey(AccessUser, on_delete=models.SET_NULL, null=True, blank=True)
    guest_pass = models.ForeignKey(GuestPass, on_delete=models.SET_NULL, null=True, blank=True)
    subject_name = models.CharField(max_length=120)
    subject_type = models.CharField(max_length=20, choices=SUBJECT_TYPES)
    action = models.CharField(max_length=20, choices=ACTIONS)
    success = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Notification(models.Model):
    TYPES = [
        ("gate", "Шлагбаум"),
        ("guest", "Гость"),
        ("qr", "QR"),
        ("alert", "Система"),
    ]

    user = models.ForeignKey(AccessUser, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=TYPES)
    title = models.CharField(max_length=140)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
