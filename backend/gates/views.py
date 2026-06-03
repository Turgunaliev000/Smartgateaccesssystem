import json
from datetime import datetime, time, timedelta

from django.contrib.auth import logout
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from .models import AccessLog, AccessUser, Gate, GuestPass, Notification


def payload(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def current_user(request):
    user_id = request.session.get("access_user_id")
    if user_id:
        user = AccessUser.objects.filter(id=user_id).first()
        if user:
            return user
    user = AccessUser.objects.filter(is_admin=True, is_active=True).first()
    if user:
        request.session["access_user_id"] = user.id
    return user


def require_user(request):
    user = current_user(request)
    if not user:
        return None, JsonResponse({"detail": "Не выполнен вход в систему"}, status=401)
    return user, None


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
        "isAdmin": user.is_admin,
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
        "reason": guest_pass.reason,
        "validUntil": timezone.localtime(guest_pass.valid_until).strftime("%H:%M"),
        "validUntilIso": guest_pass.valid_until.isoformat(),
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
    return JsonResponse({"user": user_payload(user)})


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
    if request.method == "GET":
        passes = GuestPass.objects.filter(host=user).order_by("-created_at")[:20]
        today = GuestPass.objects.filter(host=user, created_at__date=timezone.localdate()).count()
        week = GuestPass.objects.filter(host=user, created_at__gte=timezone.now() - timedelta(days=7)).count()
        month = GuestPass.objects.filter(host=user, created_at__month=timezone.localdate().month).count()
        return JsonResponse({"passes": [guest_payload(item) for item in passes], "stats": {"today": today, "week": week, "month": month}})
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)

    data = payload(request)
    valid_text = data.get("validUntil", "")
    hour, minute = [int(part) for part in valid_text.split(":")]
    valid_until = timezone.make_aware(datetime.combine(timezone.localdate(), time(hour, minute)))
    guest_pass = GuestPass.objects.create(
        guest_name=data.get("name", "").strip(),
        reason=data.get("reason", "other"),
        host=user,
        valid_until=valid_until,
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

    if guest_pass.is_used:
        return JsonResponse({"status": "used", "pass": guest_payload(guest_pass), "detail": "Пропуск уже использован"}, status=409)

    if guest_pass.is_expired:
        return JsonResponse({"status": "expired", "pass": guest_payload(guest_pass), "detail": "Срок действия пропуска истёк"}, status=409)

    now = timezone.now()
    guest_pass.is_used = True
    guest_pass.save(update_fields=["is_used"])

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
        message=f"{guest_pass.guest_name} использовал гостевой QR-пропуск",
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
    logs = AccessLog.objects.all()[:80]
    today = AccessLog.objects.filter(created_at__date=timezone.localdate()).count()
    week = AccessLog.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
    month = AccessLog.objects.filter(created_at__month=timezone.localdate().month).count()
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
    if not user.is_admin:
        return JsonResponse({"detail": "Недостаточно прав"}, status=403)
    if request.method == "GET":
        users = AccessUser.objects.all().order_by("full_name")
        return JsonResponse({"users": [user_payload(item) for item in users]})
    if request.method != "POST":
        return JsonResponse({"detail": "Метод не поддерживается"}, status=405)
    data = payload(request)
    created = AccessUser.objects.create(
        full_name=data.get("name", "").strip(),
        email=data.get("email", f"user-{timezone.now().timestamp()}@salymbekov.edu"),
        user_type=data.get("type", "student"),
        phone=data.get("phone", ""),
        department=data.get("department", "Салымбеков Университет"),
        identifier=data.get("identifier", f"USR-{int(timezone.now().timestamp())}"),
    )
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
    if not admin_user.is_admin:
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
