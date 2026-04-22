"""
Celery application configuration for background tasks
"""
from celery import Celery
from app.config import settings

celery_app = Celery(
    "salon_management",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.celery_tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

celery_app.conf.task_routes = {
    'app.celery_tasks.send_booking_confirmation': {'queue': 'email'},
    'app.celery_tasks.send_reminder': {'queue': 'notifications'},
    'app.celery_tasks.update_slot_status': {'queue': 'background'},
}

if __name__ == '__main__':
    celery_app.start()
