from django.db import migrations, models


def set_existing_usage_counts(apps, schema_editor):
    GuestPass = apps.get_model("gates", "GuestPass")
    GuestPass.objects.filter(is_used=True).update(usage_count=1)


class Migration(migrations.Migration):
    dependencies = [
        ("gates", "0004_guestpass_comment_guestpass_guest_phone_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="guestpass",
            name="pass_type",
            field=models.CharField(
                choices=[("one_time", "Одноразовый"), ("multiple", "Многоразовый")],
                default="one_time",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="guestpass",
            name="usage_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(set_existing_usage_counts, migrations.RunPython.noop),
    ]
