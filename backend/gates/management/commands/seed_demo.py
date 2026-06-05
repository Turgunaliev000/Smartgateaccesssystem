from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from backend.gates.models import AccessLog, AccessUser, Gate, GuestPass, Notification


class Command(BaseCommand):
    help = "Create demo data for the Smart Gate system."

    def handle(self, *args, **options):
        gate, _ = Gate.objects.get_or_create(
            name="Главный въезд",
            defaults={"location": "Салымбеков Университет"},
        )

        users_data = [
            ("Эмир Тургуналиев", "emir.turgunaliev@salymbekov.edu", "admin", True, "ADM-2026-0001", 42),
            ("Проф. Жамиля Исакова", "zhamilya.isakova@salymbekov.edu", "staff", False, "STF-2024-0311", 67),
            ("Нургуль Бекова", "nurgul.bekova@salymbekov.edu", "student", False, "STU-2024-0135", 38),
            ("Д-р Алмаз Асанов", "almaz.asanov@salymbekov.edu", "staff", False, "STF-2023-0042", 54),
            ("Азамат Султанов", "azamat.sultanov@salymbekov.edu", "student", False, "STU-2025-0208", 12),
        ]
        users = []
        for name, email, user_type, is_admin, identifier, access_count in users_data:
            AccessUser.objects.filter(identifier=identifier).exclude(email=email).update(email=email)
            user, _ = AccessUser.objects.update_or_create(
                email=email,
                defaults={
                    "full_name": name,
                    "phone": "+996 555 123 456",
                    "user_type": user_type,
                    "department": "Информационные технологии",
                    "identifier": identifier,
                    "is_admin": is_admin,
                    "is_active": name != "Азамат Султанов",
                    "access_count": access_count,
                },
            )
            user.set_password("123456")
            user.save(update_fields=["password_hash"])
            users.append(user)

        admin_user = users[0]
        if AccessLog.objects.count() == 0:
            sample_names = [
                (users[0], "open"),
                (None, "qr", "Айбек Каримов"),
                (users[1], "open"),
                (users[2], "open"),
                (None, "qr", "Данияр Омуров"),
                (users[3], "open"),
            ]
            for index, item in enumerate(sample_names):
                user = item[0]
                action = item[1]
                guest_name = item[2] if len(item) > 2 else ""
                subject_name = guest_name or user.full_name
                subject_type = "guest" if guest_name else ("admin" if user.is_admin else user.user_type)
                log = AccessLog.objects.create(
                    gate=gate,
                    user=user,
                    subject_name=subject_name,
                    subject_type=subject_type,
                    action=action,
                    success=True,
                )
                log.created_at = timezone.now() - timedelta(minutes=35 * index)
                log.save(update_fields=["created_at"])

        if GuestPass.objects.count() == 0:
            GuestPass.objects.create(
                guest_name="Айбек Каримов",
                reason="meeting",
                host=admin_user,
                valid_until=timezone.now() + timedelta(hours=3),
            )

        if Notification.objects.filter(user=admin_user).count() == 0:
            messages = [
                ("guest", "Ваш гость прибыл на КПП", "Айбек Каримов ожидает у главного въезда"),
                ("gate", "Шлагбаум открыт", "Доступ разрешён через главный въезд"),
                ("qr", "QR-код использован", "Гостевой пропуск активирован"),
                ("alert", "Плановое обслуживание", "Система будет недоступна завтра с 02:00 до 04:00"),
            ]
            for index, (kind, title, message) in enumerate(messages):
                notification = Notification.objects.create(
                    user=admin_user,
                    notification_type=kind,
                    title=title,
                    message=message,
                    is_read=index > 1,
                )
                notification.created_at = timezone.now() - timedelta(minutes=20 * index)
                notification.save(update_fields=["created_at"])

        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
