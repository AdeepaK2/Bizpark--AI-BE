from typing import Any

from app.agents.base import BaseAgent


class CopywriterAgent(BaseAgent):
    name = "copywriter"

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        # TODO: Implement with LangGraph/CrewAI
        return {"copy": None}
