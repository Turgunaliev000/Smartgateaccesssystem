import json
import re
import secrets
from datetime import datetime, time, timedelta

from django.contrib.auth import logout
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from .models import AccessLog, AccessUser, Gate, GuestPass, Notification, PasswordResetCode


def payload(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def current_user(request):
    user_id = request.session.get("access_user_id")
    if user_id:
        user = AccessUser.objects.filter(id=user_id, is_active=True).first()
        if user:
            return user
        request.session.pop("access_user_id", None)
    return None


def require_user(request):
    user = current_user(request)
    if not user:
        return None, JsonResponse({"detail": "Не выполнен вход в систему"}, status=401)
    return user, None


def role_of(user):
    if user.is_admin:
        return "admin"
    return user.user_type


def has_role(user, *roles):
    return role_of(user) in roles


def permission_denied():
    return JsonResponse({"detail": "Недостаточно прав для этого действия"}, status=403)


def gate_payload(gate):
    now = timezone.now()
    is_open = bool(gate.is_open and gate.opened_until and gate.opened_until > now)
    if gate.is_open != is_open:
        gate.is_open = is_open
        gate.save(update_fields=["is_open"])
    return {
        "id": gate.id,
        "name": gate.name,
        "location": gate.location,
        "isOpen": is_open,
        "lastOpenedAt": gate.last_opened_at.isoformat() if gate.last_opened_at else None,
        "openedUntil": gate.opened_until.isoformat() if gate.opened_until else None,
    }


def user_payload(user):
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "type": user.user_type,
        "department": user.department,
        "identifier": user.identifier,
        "status": "active" if user.is_active else "blocked",
        "isAdmin": has_role(user, "admin"),
        "accessCount": user.access_count,
    }


def log_payload(log):
    local_time = timezone.localtime(log.created_at)
    today = timezone.localdate()
    if local_time.date() == today:
        date_label = "Сегодня"
    elif local_time.date() == today - timedelta(days=1):
        date_label = "Вчера"
    else:
        date_label = local_time.strftime("%d.%m.%Y")
    return {
        "id": log.id,
        "type": log.subject_type,
        "name": log.subject_name,
        "action": log.action,
        "success": log.success,
        "time": local_time.strftime("%H:%M"),
        "date": date_label,
        "createdAt": log.created_at.isoformat(),
    }


def notification_payload(notification):
    delta = timezone.now() - notification.created_at
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        time_label = "только что"
    elif minutes < 60:
        time_label = f"{minutes} минут назад"
    elif minutes < 1440:
        time_label = f"{minutes // 60} часов назад"
    else:
        time_label = f"{minutes // 1440} дней назад"
    return {
        "id": notification.id,
        "type": notification.notification_type,
        "title": notification.title,
        "message": notification.message,
        "time": time_label,
        "read": notification.is_read,
        "createdAt": notification.created_at.isoformat(),
    }


def guest_payload(guest_pass):
    return {
        "id": guest_pass.id,
        "code": guest_pass.code,
        "name": guest_pass.guest_name,
        "phone": guest_pass.guest_phone,
        "vehiclePlate": guest_pass.vehicle_plate,
        "comment": guest_pass.comment,
        "reason": guest_pass.reason,
        "validUntil": timezone.localtime(guest_pass.valid_until).strftime("%H:%M"),
        "validUntilIso": guest_pass.valid_until.isoformat(),
        "passType": guest_pass.pass_type,
        "usageCount": guest_pass.usage_count,
        "status": guest_pass.status,
    }


def extract_guest_code(raw_code):
    raw_code = (raw_code or "").strip()
    if not raw_code:
        return ""
    try:
        parsed = json.loads(raw_code)
    except json.JSONDecodeError:
        return raw_code
    if isinstance(parsed, dict):
        return str(parsed.get("code", "")).strip()
    return raw_code


@csrf_exempt
@ensure_csrf_cookie
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)
    data = payload(request)
    email = data.get("email", "").strip().lower()
    user = AccessUser.objects.filter(email=email, is_active=True).first()
    if not user:
        return JsonResponse({"detail": "Пользователь не найден или заблокирован"}, status=401)
    if not user.check_password(data.get("password", "")):
        return JsonResponse({"detail": "Неверный пароль"}, status=401)
    request.session["access_user_id"] = user.id
    request.session.set_expiry(60 * 60 * 24 * 30)
    return JsonResponse({"user": user_payload(user)})


@csrf_exempt
def register_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)

    data = payload(request)
    full_name = " ".join(data.get("name", "").strip().split())
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    department = data.get("department", "").strip()
    password = data.get("password", "")
    password_confirm = data.get("passwordConfirm", "")

    if len(full_name) < 3:
        return JsonResponse({"detail": "Укажите имя и фамилию"}, status=400)
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"detail": "Введите корректный email"}, status=400)
    if phone and not re.fullmatch(r"[+()\d\s-]{7,24}", phone):
        return JsonResponse({"detail": "Введите корректный номер телефона"}, status=400)
    if len(password) < 8:
        return JsonResponse({"detail": "Пароль должен содержать минимум 8 символов"}, status=400)
    if password != password_confirm:
        return JsonResponse({"detail": "Пароли не совпадают"}, status=400)
    if AccessUser.objects.filter(email__iexact=email).exists():
        return JsonResponse({"detail": "Аккаунт с таким email уже существует"}, status=409)

    try:
        user = AccessUser(
            full_name=full_name,
            email=email,
            phone=phone,
            user_type=AccessUser.STUDENT,
            department=department,
            identifier=f"USR-{secrets.token_hex(4).upper()}",
            is_active=True,
            is_admin=False,
        )
        user.set_password(password)
        user.save()
    except IntegrityError:
        return JsonResponse({"detail": "Не удалось создать аккаунт. Попробуйте ещё раз"}, status=409)

    Notification.objects.create(
        user=user,
        notification_type="alert",
        title="Добро пожаловать в Smart Gate",
        message="Аккаунт создан. Ваша роль и доступ могут быть изменены администратором.",
    )
    request.session["access_user_id"] = user.id
    request.session.set_expiry(60 * 60 * 24 * 30)
    return JsonResponse({"user": user_payload(user)}, status=201)


@csrf_exempt
def request_password_reset_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)

    email = payload(request).get("email", "").strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"detail": "Введите корректный email"}, status=400)

    user = AccessUser.objects.filter(email__iexact=email, is_active=True).first()
    if user:
        recent_code = PasswordResetCode.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(seconds=60),
        ).first()
        if recent_code:
            return JsonResponse(
                {"detail": "Новый код можно запросить через минуту"},
                status=429,
            )

        PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
        raw_code = f"{secrets.randbelow(1_000_000):06d}"
        reset_code = PasswordResetCode(
            user=user,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        reset_code.set_code(raw_code)
        reset_code.save()

        try:
            send_mail(
                "Код восстановления Smart Gate",
                (
                    f"Здравствуйте, {user.full_name}.\n\n"
                    f"Ваш код восстановления пароля: {raw_code}\n"
                    "Код действует 10 минут. Никому его не сообщайте.\n\n"
                    "Если вы не запрашивали смену пароля, проигнорируйте это письмо."
                ),
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception:
            reset_code.delete()
            return JsonResponse(
                {"detail": "Не удалось отправить письмо. Попробуйте позже"},
                status=503,
            )

    return JsonResponse({"detail": "Если аккаунт существует, код отправлен на указанный email"})


def close_user_sessions(user_id):
    for session in Session.objects.filter(expire_date__gte=timezone.now()).iterator():
        try:
            if session.get_decoded().get("access_user_id") == user_id:
                session.delete()
        except Exception:
            continue


@csrf_exempt
def confirm_password_reset_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)

    data = payload(request)
    email = data.get("email", "").strip().lower()
    code = re.sub(r"\D", "", data.get("code", ""))
    password = data.get("password", "")
    password_confirm = data.get("passwordConfirm", "")

    if len(code) != 6:
        return JsonResponse({"detail": "Введите шестизначный код"}, status=400)
    if len(password) < 8:
        return JsonResponse({"detail": "Пароль должен содержать минимум 8 символов"}, status=400)
    if password != password_confirm:
        return JsonResponse({"detail": "Пароли не совпадают"}, status=400)

    user = AccessUser.objects.filter(email__iexact=email, is_active=True).first()
    reset_code = PasswordResetCode.objects.filter(user=user, used_at__isnull=True).first() if user else None
    if not reset_code or not reset_code.is_valid:
        return JsonResponse({"detail": "Код недействителен или срок его действия истёк"}, status=400)

    if not reset_code.check_code(code):
        reset_code.attempts += 1
        reset_code.save(update_fields=["attempts"])
        return JsonResponse({"detail": "Неверный код"}, status=400)

    with transaction.atomic():
        user.set_password(password)
        user.save(update_fields=["password_hash"])
        reset_code.used_at = timezone.now()
        reset_code.save(update_fields=["used_at"])
        PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())

    close_user_sessions(user.id)
    Notification.objects.create(
        user=user,
        notification_type="alert",
        title="Пароль изменён",
        message="Пароль аккаунта был восстановлен с помощью кода из email.",
    )
    return JsonResponse({"detail": "Пароль успешно изменён"})


@csrf_exempt
def logout_view(request):
    logout(request)
    request.session.flush()
    return JsonResponse({"ok": True})


@ensure_csrf_cookie
def me_view(request):
    user, error = require_user(request)
    if error:
        return error
    return JsonResponse({"user": user_payload(user)})


def dashboard_view(request):
    user, error = require_user(request)
    if error:
        return error
    gate = Gate.objects.first()
    logs_today = AccessLog.objects.filter(created_at__date=timezone.localdate()).count()
    guests_today = GuestPass.objects.filter(created_at__date=timezone.localdate()).count()
    month_access = AccessLog.objects.filter(created_at__month=timezone.localdate().month).count()
    return JsonResponse(
        {
            "user": user_payload(user),
            "gate": gate_payload(gate),
            "stats": {
                "todayAccess": logs_today,
                "todayGuests": guests_today,
                "monthAccess": month_access,
                "security": 98,
                "timeSaved": 40,
                "control": 100,
            },
        }
    )


@csrf_exempt
def open_gate_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)
    user, error = require_user(request)
    if error:
        return error
    if not user.is_active:
        return JsonResponse({"detail": "Доступ пользователя заблокирован"}, status=403)
    gate = Gate.objects.first()
    now = timezone.now()
    gate.is_open = True
    gate.last_opened_at = now
    gate.opened_until = now + timedelta(seconds=5)
    gate.save()
    user.access_count += 1
    user.save(update_fields=["access_count"])
    AccessLog.objects.create(
        gate=gate,
        user=user,
        subject_name=user.full_name,
        subject_type="admin" if user.is_admin else user.user_type,
        action="open",
        success=True,
    )
    Notification.objects.create(
        user=user,
        notification_type="gate",
        title="Шлагбаум открыт",
        message=f"Доступ разрешён через {gate.name}",
    )
    return JsonResponse({"gate": gate_payload(gate), "user": user_payload(user)})


@csrf_exempt
def guest_passes_view(request):
    user, error = require_user(request)
    if error:
        return error
    if not has_role(user, "admin", "staff"):
        return permission_denied()
    if request.method == "GET":
        queryset = GuestPass.objects.all() if has_role(user, "admin") else GuestPass.objects.filter(host=user)
        passes = queryset.order_by("-created_at")[:20]
        today = queryset.filter(created_at__date=timezone.localdate()).count()
        week = queryset.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
        month = queryset.filter(created_at__month=timezone.localdate().month).count()
        return JsonResponse({"passes": [guest_payload(item) for item in passes], "stats": {"today": today, "week": week, "month": month}})
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)

    data = payload(request)
    valid_text = data.get("validUntil", "")
    hour, minute = [int(part) for part in valid_text.split(":")]
    valid_until = timezone.make_aware(datetime.combine(timezone.localdate(), time(hour, minute)))
    guest_pass = GuestPass.objects.create(
        guest_name=data.get("name", "").strip(),
        guest_phone=data.get("phone", "").strip(),
        vehicle_plate=data.get("vehiclePlate", "").strip().upper(),
        comment=data.get("comment", "").strip(),
        reason=data.get("reason", "other"),
        host=user,
        valid_until=valid_until,
        pass_type=data.get("passType") if data.get("passType") in [GuestPass.ONE_TIME, GuestPass.MULTIPLE] else GuestPass.ONE_TIME,
    )
    Notification.objects.create(
        user=user,
        notification_type="qr",
        title="Гостевой QR-код создан",
        message=f"Пропуск для {guest_pass.guest_name} действует до {valid_text}",
    )
    return JsonResponse({"pass": guest_payload(guest_pass)}, status=201)


@csrf_exempt
def scan_guest_pass_view(request):
    user, error = require_user(request)
    if error:
        return error
    if not has_role(user, "admin", "security"):
        return permission_denied()
    if request.method == "GET":
        passes = GuestPass.objects.select_related("host").order_by("-created_at")[:80]
        recent_logs = AccessLog.objects.filter(subject_type="guest").order_by("-created_at")[:10]
        return JsonResponse(
            {
                "passes": [guest_payload(item) for item in passes],
                "recentLogs": [log_payload(item) for item in recent_logs],
                "stats": {
                    "active": sum(1 for item in passes if item.status == "active"),
                    "used": sum(1 for item in passes if item.status == "used"),
                    "expired": sum(1 for item in passes if item.status == "expired"),
                },
            }
        )
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)

    data = payload(request)
    code = extract_guest_code(data.get("code", ""))
    gate = Gate.objects.first()
    guest_pass = GuestPass.objects.filter(code=code).select_related("host").first()
    if not guest_pass:
        AccessLog.objects.create(
            gate=gate,
            subject_name="Неизвестный QR",
            subject_type="guest",
            action="denied",
            success=False,
        )
        return JsonResponse({"status": "denied", "detail": "Пропуск не найден"}, status=404)

    if guest_pass.pass_type == GuestPass.ONE_TIME and guest_pass.is_used:
        return JsonResponse({"status": "used", "pass": guest_payload(guest_pass), "detail": "Пропуск уже использован"}, status=409)

    if guest_pass.is_expired:
        return JsonResponse({"status": "expired", "pass": guest_payload(guest_pass), "detail": "Срок действия пропуска истёк"}, status=409)

    now = timezone.now()
    with transaction.atomic():
        guest_pass = GuestPass.objects.select_for_update().select_related("host").get(id=guest_pass.id)
        if guest_pass.pass_type == GuestPass.ONE_TIME and guest_pass.is_used:
            return JsonResponse({"status": "used", "pass": guest_payload(guest_pass), "detail": "Пропуск уже использован"}, status=409)
        if guest_pass.is_expired:
            return JsonResponse({"status": "expired", "pass": guest_payload(guest_pass), "detail": "Срок действия пропуска истёк"}, status=409)
        guest_pass.usage_count += 1
        update_fields = ["usage_count"]
        if guest_pass.pass_type == GuestPass.ONE_TIME:
            guest_pass.is_used = True
            update_fields.append("is_used")
        guest_pass.save(update_fields=update_fields)

    gate.is_open = True
    gate.last_opened_at = now
    gate.opened_until = now + timedelta(seconds=5)
    gate.save()

    AccessLog.objects.create(
        gate=gate,
        guest_pass=guest_pass,
        subject_name=guest_pass.guest_name,
        subject_type="guest",
        action="qr",
        success=True,
    )
    Notification.objects.create(
        user=guest_pass.host,
        notification_type="guest",
        title="Гость прошёл через КПП",
        message=f"{guest_pass.guest_name} использовал гостевой QR-пропуск ({guest_pass.usage_count}-й проход)",
    )
    Notification.objects.create(
        user=user,
        notification_type="gate",
        title="QR-пропуск подтверждён",
        message=f"Доступ разрешён для {guest_pass.guest_name}",
    )

    return JsonResponse({"status": "allowed", "pass": guest_payload(guest_pass), "gate": gate_payload(gate)})


def access_logs_view(request):
    user, error = require_user(request)
    if error:
        return error
    if has_role(user, "admin", "security"):
        queryset = AccessLog.objects.all()
    else:
        queryset = AccessLog.objects.filter(user=user)
    logs = queryset[:80]
    today = queryset.filter(created_at__date=timezone.localdate()).count()
    week = queryset.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
    month = queryset.filter(created_at__month=timezone.localdate().month).count()
    return JsonResponse({"logs": [log_payload(log) for log in logs], "stats": {"today": today, "week": week, "month": month}})


@csrf_exempt
def notifications_view(request):
    user, error = require_user(request)
    if error:
        return error
    notifications = Notification.objects.filter(user=user)[:80]
    return JsonResponse({"notifications": [notification_payload(item) for item in notifications]})


@csrf_exempt
def notification_read_view(request, notification_id):
    user, error = require_user(request)
    if error:
        return error
    Notification.objects.filter(id=notification_id, user=user).update(is_read=True)
    return JsonResponse({"ok": True})


@csrf_exempt
def notifications_read_all_view(request):
    user, error = require_user(request)
    if error:
        return error
    Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    return JsonResponse({"ok": True})


@csrf_exempt
def notification_delete_view(request, notification_id):
    user, error = require_user(request)
    if error:
        return error
    if request.method != "DELETE":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)
    Notification.objects.filter(id=notification_id, user=user).delete()
    return JsonResponse({"ok": True})


@csrf_exempt
def users_view(request):
    user, error = require_user(request)
    if error:
        return error
    if not has_role(user, "admin"):
        return JsonResponse({"detail": "Недостаточно прав"}, status=403)
    if request.method == "GET":
        users = AccessUser.objects.all().order_by("full_name")
        return JsonResponse({"users": [user_payload(item) for item in users]})
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)
    data = payload(request)
    user_type = data.get("type", "student")
    if user_type not in ["student", "staff", "security", "admin"]:
        return JsonResponse({"detail": "Неверная должность пользователя"}, status=400)
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    if not data.get("name", "").strip() or not email or len(password) < 6:
        return JsonResponse({"detail": "Укажите имя, email и пароль минимум из 6 символов"}, status=400)
    if AccessUser.objects.filter(email=email).exists():
        return JsonResponse({"detail": "Пользователь с таким email уже существует"}, status=409)
    created = AccessUser.objects.create(
        full_name=data.get("name", "").strip(),
        email=email,
        user_type=user_type,
        phone=data.get("phone", "").strip(),
        department=data.get("department", "Салымбеков Университет"),
        identifier=data.get("identifier", f"USR-{int(timezone.now().timestamp())}"),
        is_admin=user_type == "admin",
    )
    created.set_password(password)
    created.save(update_fields=["password_hash"])
    Notification.objects.create(
        user=user,
        notification_type="alert",
        title="Пользователь добавлен",
        message=f"{created.full_name} добавлен в систему доступа",
    )
    return JsonResponse({"user": user_payload(created)}, status=201)


@csrf_exempt
def user_toggle_view(request, user_id):
    admin_user, error = require_user(request)
    if error:
        return error
    if not has_role(admin_user, "admin"):
        return JsonResponse({"detail": "Недостаточно прав"}, status=403)
    target = AccessUser.objects.get(id=user_id)
    target.is_active = not target.is_active
    target.save(update_fields=["is_active"])
    Notification.objects.create(
        user=admin_user,
        notification_type="alert",
        title="Статус пользователя изменён",
        message=f"{target.full_name}: {'активен' if target.is_active else 'заблокирован'}",
    )
    return JsonResponse({"user": user_payload(target)})


@csrf_exempt
def user_role_view(request, user_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)
    admin_user, error = require_user(request)
    if error:
        return error
    if not has_role(admin_user, "admin"):
        return permission_denied()

    target = AccessUser.objects.filter(id=user_id).first()
    if not target:
        return JsonResponse({"detail": "Пользователь не найден"}, status=404)

    role = payload(request).get("role", "")
    valid_roles = {AccessUser.STUDENT, AccessUser.STAFF, AccessUser.SECURITY, AccessUser.ADMIN}
    if role not in valid_roles:
        return JsonResponse({"detail": "Неверная роль пользователя"}, status=400)
    if target.id == admin_user.id and role != AccessUser.ADMIN:
        return JsonResponse({"detail": "Нельзя снять роль администратора у самого себя"}, status=400)

    target.user_type = role
    target.is_admin = role == AccessUser.ADMIN
    target.save(update_fields=["user_type", "is_admin"])

    Notification.objects.create(
        user=target,
        notification_type="alert",
        title="Роль аккаунта изменена",
        message=f"Вам назначена роль «{target.get_user_type_display()}».",
    )
    return JsonResponse({"user": user_payload(target)})
