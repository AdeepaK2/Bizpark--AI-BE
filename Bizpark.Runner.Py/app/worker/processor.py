import json
import logging

from bullmq import Worker
from sqlalchemy import select

from app.config import settings
from app.db.models import AgentTask, TaskStatus
from app.db.session import async_session

logger = logging.getLogger("runner.processor")


async def process_agent_task(job, token=None):
    """Process a single agent task from BullMQ queue."""
    job_data = job.data
    task_id = job_data["taskId"]
    business_id = job_data["businessId"]
    task_type = job_data["taskType"]
    input_data = job_data.get("inputData", {})

    logger.info(f"[AGENT START] Task {task_id} [{task_type}]: Processing for business {business_id}...")

    async with async_session() as session:
        result = await session.execute(select(AgentTask).where(AgentTask.id == task_id))
        task = result.scalar_one_or_none()

        if task:
            task.status = TaskStatus.PROCESSING
            await session.commit()
        else:
            task = AgentTask(
                id=task_id,
                business_id=business_id,
                task_type=task_type,
                status=TaskStatus.PROCESSING,
                input_data=input_data,
            )
            session.add(task)
            await session.commit()

        # TODO: Replace with actual AI agent flow (LangGraph/CrewAI)
        import asyncio
        await asyncio.sleep(3)
        output = {"generatedContent": "FastAPI Runner Mock Response"}

        task.status = TaskStatus.COMPLETED
        task.output_data = output
        await session.commit()

    logger.info(f"[AGENT SUCCESS] Task {task_id}: Done.")


async def start_worker():
    """Start BullMQ worker that listens to 'agent-queue'."""
    worker = Worker(
        "agent-queue",
        process_agent_task,
        {
            "connection": {
                "host": settings.redis_host,
                "port": settings.redis_port,
            },
        },
    )
    logger.info("BullMQ Worker started — listening on 'agent-queue'")
    return worker
