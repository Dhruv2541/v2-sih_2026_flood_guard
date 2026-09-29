"""Background scheduler management module for Assam Flood Guard.

DEPLOYMENT INVARIANT:
- This module implements an in-process AsyncIOScheduler running directly within
  the FastAPI application's event loop.
- SCHEDULER_ENABLED=true MUST NOT be used with multiple Uvicorn/Gunicorn application
  workers (e.g. `uvicorn --workers 4`). With multiple workers, each process would
  instantiate its own APScheduler instance, resulting in duplicate queries to Open-Meteo.
- The prototype deployment must run exactly one scheduler-owning application process.
- In a future multi-worker production architecture, background scheduling must be
  delegated to a dedicated single-instance worker/service or an externally coordinated scheduler.
  Do NOT introduce Redis, Celery, distributed locks, or leader election in this phase.
"""

from datetime import datetime, timezone
import logging
from typing import Callable, Optional
from apscheduler.job import Job
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.jobs.ingestion_job import run_live_cycle_job

logger = logging.getLogger("scheduler")

LIVE_CYCLE_JOB_ID = "live_prediction_cycle"


def create_scheduler() -> AsyncIOScheduler:
    """Creates a new instance of AsyncIOScheduler.
    
    The scheduler is not started at creation time. It must be explicitly
    started within an active asyncio event loop (e.g. FastAPI lifespan).
    """
    return AsyncIOScheduler()


def register_live_cycle_job(
    scheduler: AsyncIOScheduler,
    interval_minutes: int = 60,
    job_func: Optional[Callable] = None,
) -> Job:
    """Registers the complete live prediction cycle job with the scheduler.
    
    Configuration invariants:
    - id: 'live_prediction_cycle' (stable unique identifier)
    - trigger: IntervalTrigger(minutes=interval_minutes)
      (first execution occurs after interval_minutes; not immediately on startup)
    - max_instances: 1 (strictly prevents overlapping executions of the cycle
      job WITHIN this single APScheduler instance/process; does not provide distributed
      multi-process concurrency guarantees)
    - coalesce: True (collapses missed runs into a single execution)
    - misfire_grace_time: 300 (5-minute tolerance for late execution)
    - replace_existing: True (prevents duplicate jobs within this scheduler)

    Args:
        scheduler: The AsyncIOScheduler to register with.
        interval_minutes: Cycle interval in minutes (must be > 0).
        job_func: Optional job callable to execute (defaults to run_live_cycle_job).

    Returns:
        Job: The registered APScheduler Job instance.
    """
    if interval_minutes <= 0:
        raise ValueError("interval_minutes must be a positive integer greater than 0.")

    func = job_func or run_live_cycle_job
    trigger = IntervalTrigger(minutes=interval_minutes)

    job = scheduler.add_job(
        func,
        trigger=trigger,
        id=LIVE_CYCLE_JOB_ID,
        name="Scheduled Live Prediction Cycle",
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
        replace_existing=True,
    )
    now_utc = datetime.now(timezone.utc)
    next_fire = getattr(job, "next_run_time", None) or trigger.get_next_fire_time(None, now_utc)
    logger.info(
        f"Registered job '{LIVE_CYCLE_JOB_ID}' with interval of {interval_minutes} minutes. "
        f"First run scheduled at: {next_fire}."
    )
    return job


def start_scheduler(scheduler: AsyncIOScheduler) -> None:
    """Starts the scheduler within the active event loop if not already running."""
    if not scheduler.running:
        scheduler.start()
        logger.info("Background scheduler started.")
    else:
        logger.warning("Scheduler start requested, but scheduler is already running.")


def stop_scheduler(scheduler: AsyncIOScheduler) -> None:
    """Cleanly shuts down the scheduler if running."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped cleanly.")
    else:
        logger.debug("Scheduler stop requested, but scheduler was not running.")
