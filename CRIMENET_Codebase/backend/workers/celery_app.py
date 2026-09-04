from celery import Celery
import os

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

from core.telemetry import setup_telemetry
setup_telemetry(is_celery=True)

celery_app = Celery(
    "veille_worker",
    broker=redis_url,
    backend=redis_url,
    include=["workers.tasks", "workers.outbox_processor"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "process-outbox-every-2-seconds": {
            "task": "process_outbox_events",
            "schedule": 2.0,
        },
    }
)
