import json
import re
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings

from .models import AccessUser, PasswordResetCode


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    BREVO_API_KEY="",
)
class PasswordResetTests(TestCase):
    def setUp(self):
        self.user = AccessUser.objects.create(
            full_name="Тестовый Пользователь",
            email="test@example.com",
            identifier="TEST-001",
        )
        self.user.set_password("old-password")
        self.user.save(update_fields=["password_hash"])

    def post_json(self, path, data):
        return self.client.post(path, data=json.dumps(data), content_type="application/json")

    def request_code(self):
        response = self.post_json("/api/auth/password-reset/request/", {"email": self.user.email})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        match = re.search(r"\b(\d{6})\b", mail.outbox[0].body)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_password_can_be_reset_with_email_code(self):
        code = self.request_code()
        stored_code = PasswordResetCode.objects.get(user=self.user)
        self.assertNotIn(code, stored_code.code_hash)

        response = self.post_json(
            "/api/auth/password-reset/confirm/",
            {
                "email": self.user.email,
                "code": code,
                "password": "new-password",
                "passwordConfirm": "new-password",
            },
        )
        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertFalse(self.user.check_password("old-password"))
        self.assertTrue(self.user.check_password("new-password"))
        stored_code.refresh_from_db()
        self.assertIsNotNone(stored_code.used_at)

    def test_repeated_request_is_rate_limited(self):
        self.request_code()
        response = self.post_json("/api/auth/password-reset/request/", {"email": self.user.email})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(len(mail.outbox), 1)

    def test_wrong_code_increases_attempt_count(self):
        self.request_code()
        response = self.post_json(
            "/api/auth/password-reset/confirm/",
            {
                "email": self.user.email,
                "code": "000000",
                "password": "new-password",
                "passwordConfirm": "new-password",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(PasswordResetCode.objects.get(user=self.user).attempts, 1)

    def test_unknown_email_does_not_disclose_account(self):
        response = self.post_json("/api/auth/password-reset/request/", {"email": "missing@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        BREVO_API_KEY="test-api-key",
        BREVO_SENDER_EMAIL="verified@example.com",
        BREVO_SENDER_NAME="Smart Gate",
    )
    @patch("backend.gates.views.urllib.request.urlopen")
    def test_brevo_api_is_used_when_configured(self, urlopen):
        response = self.post_json("/api/auth/password-reset/request/", {"email": self.user.email})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        email_request = urlopen.call_args.args[0]
        request_data = json.loads(email_request.data.decode("utf-8"))
        self.assertEqual(email_request.full_url, "https://api.brevo.com/v3/smtp/email")
        self.assertEqual(request_data["sender"]["email"], "verified@example.com")
        self.assertEqual(request_data["to"][0]["email"], self.user.email)
