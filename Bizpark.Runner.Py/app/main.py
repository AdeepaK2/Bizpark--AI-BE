import asyncio
import logging

import uvicorn
from fastapi import FastAPI

from app.config import settings
from app.worker.processor import start_worker

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("runner")

app = FastAPI(title="Bizpark Runner", version="0.1.0")

_worker = None
_worker_task: asyncio.Task | None = None


@app.get("/")
async def health():
    return {"status": "ok", "service": "bizpark-runner"}


@app.on_event("startup")
async def startup():
    global _worker, _worker_task
    logger.info("Starting BullMQ worker...")
    _worker = await start_worker()
    # Keep the worker alive in the event loop for the lifetime of the process
    _worker_task = asyncio.create_task(_keep_alive())


async def _keep_alive():
    """Holds a coroutine open so the worker is never garbage-collected."""
    try:
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass


@app.on_event("shutdown")
async def shutdown():
    global _worker, _worker_task
    if _worker_task:
        _worker_task.cancel()
    if _worker:
        await _worker.close()
        logger.info("BullMQ worker stopped.")


if __name__ == "__main__":
    # reload=True is intentionally omitted — it kills the BullMQ worker subprocess
    # on every file change. Run 'python -m app.main' for stable long-running operation.
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=False)
