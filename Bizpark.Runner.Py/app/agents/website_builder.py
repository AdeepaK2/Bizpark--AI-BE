import json
import logging
from typing import TypedDict, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END

from app.config import settings

logger = logging.getLogger("runner.agents.website_builder")


class WebsiteState(TypedDict):
    business: dict
    raw_cms_data: dict
    tone: str
    generated_content: Optional[dict]
    error: Optional[str]


def validate_input(state: WebsiteState) -> WebsiteState:
    business = state.get("business", {})
    if not business.get("name"):
        return {**state, "error": "Business name is missing"}
    return {**state, "error": None}


def generate_with_gemini(state: WebsiteState) -> WebsiteState:
    if state.get("error"):
        return state

    business = state["business"]
    raw = state.get("raw_cms_data", {})
    tone = state.get("tone", "professional")

    user_provided = "\n".join(
        f"  {k}: {v}" for k, v in raw.items() if v
    ) or "  (nothing provided)"

    description = business.get("description", "").strip()
    category = business.get("category", "General Business")

    prompt = f"""You are an expert website copywriter for small businesses. Your job is to write compelling, conversion-focused copy tailored to the specific business below.

=== BUSINESS INFORMATION ===
Name: {business.get("name", "")}
Type / Category: {category}
Description (written by the owner): {description or "(not provided — infer from category)"}
Brand tone: {tone}
User-chosen brand color: {raw.get("brand.primaryColor", "(not specified — choose a suitable color for this business type)")}

=== WRITING GUIDELINES ===
- Use the owner's description as the source of truth — draw out their unique selling points
- Match the tone: {"formal and expert" if tone == "professional" else "warm and approachable" if tone == "friendly" else "energetic and direct" if tone == "bold" else "clean and understated"}
- Hero title: short punchy statement (6–10 words) that speaks to the customer's desire
- Hero subtitle: one sentence expanding on the value proposition (max 20 words)
- CTA text: action-oriented, 2–4 words (e.g. "Explore Our Menu", "Book a Session", "Shop Now")
- About title: 4–7 words, welcoming (e.g. "About Skyline Consulting", "Our Story")
- About text: 2–3 sentences telling the brand story, highlighting what makes them different
- Tagline: a memorable brand phrase under 10 words
- Colors: {"use " + raw.get("brand.primaryColor") + " as primary" if raw.get("brand.primaryColor") else "choose colors that suit a " + category + " business"}; pick a complementary secondary color

Return ONLY a valid JSON object — no markdown, no explanation, no extra text:
{{
  "businessName": "...",
  "tagline": "...",
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "content": {{
    "hero": {{
      "title": "...",
      "subtitle": "...",
      "ctaText": "...",
      "ctaLink": "/shop"
    }},
    "about": {{
      "title": "...",
      "text": "..."
    }}
  }}
}}"""

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.gemini_api_key,
            temperature=0.7,
        )
        response = llm.invoke(prompt)
        raw_text = response.content.strip()

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        generated = json.loads(raw_text)
        logger.info(f"Gemini generated content for {business.get('name')}")
        return {**state, "generated_content": generated}

    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        return {**state, "error": str(e)}


def should_end_on_error(state: WebsiteState) -> str:
    return "end" if state.get("error") else "generate"


# Build the LangGraph state graph
_builder = StateGraph(WebsiteState)
_builder.add_node("validate", validate_input)
_builder.add_node("generate", generate_with_gemini)
_builder.set_entry_point("validate")
_builder.add_conditional_edges("validate", should_end_on_error, {"generate": "generate", "end": END})
_builder.add_edge("generate", END)
website_graph = _builder.compile()


async def run_website_builder(business: dict, raw_cms_data: dict, tone: str = "professional") -> dict:
    result = await website_graph.ainvoke({
        "business": business,
        "raw_cms_data": raw_cms_data,
        "tone": tone,
        "generated_content": None,
        "error": None,
    })

    if result.get("error"):
        raise RuntimeError(result["error"])

    return result["generated_content"]
