from typing import Any

from app.agents.base import BaseAgent


class TemplateSelectorAgent(BaseAgent):
    name = "template_selector"

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        # TODO: Implement with LangGraph/CrewAI
        return {"selected_template": None}
