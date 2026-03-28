from typing import Any

from app.agents.base import BaseAgent


class ContentStrategyAgent(BaseAgent):
    name = "content_strategy"

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        # TODO: Implement with LangGraph/CrewAI
        return {"strategy": None}
