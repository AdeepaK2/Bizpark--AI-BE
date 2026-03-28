from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Base class for all AI agents in the pipeline."""

    name: str = "base"

    @abstractmethod
    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute the agent's task and return output data."""
        ...
