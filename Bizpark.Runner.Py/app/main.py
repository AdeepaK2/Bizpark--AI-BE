import asyncio
import logging

import uvicorn
from fastapi import FastAPI

from app.config import settings
from app.worker.processor import start_worker

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("runner")

app = FastAPI(title="Bizpark Runner", version="0.1.0")

worker = None


@app.get("/")
async def health():
    return {"status": "ok", "service": "bizpark-runner"}


@app.on_event("startup")
async def startup():
    global worker
    logger.info("Starting BullMQ worker...")
    worker = await start_worker()


@app.on_event("shutdown")
async def shutdown():
    global worker
    if worker:
        await worker.close()
        logger.info("BullMQ worker stopped.")


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
