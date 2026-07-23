import json
import logging
import os
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)


class AIService:
    """
    AI Content Generation Service.
    Integrates with Google Gemini API for marketing copy and prompt generation.
    Includes robust local synthesis fallback when API key is unconfigured.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.api_url = (
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        )

    def generate_marketing_content(
        self, product_name: str, product_description: str | None = None
    ) -> Dict[str, Any]:
        """
        Generates structured ad copy and visual banner prompt for a product.
        """
        desc_text = product_description if product_description else "high-quality premium product"

        if self.api_key:
            try:
                prompt_text = (
                    f"You are an expert marketing copywriter. Create compelling ad content for:\n"
                    f"Product Name: {product_name}\n"
                    f"Description: {desc_text}\n\n"
                    f"Return ONLY a valid raw JSON object (no markdown formatting, no code blocks) with keys:\n"
                    f"- headline: punchy main headline (under 10 words)\n"
                    f"- tagline: memorable slogan (under 8 words)\n"
                    f"- body_copy: engaging promotional copy (2-3 sentences)\n"
                    f"- hashtags: array of 4-5 trending hashtags (e.g. ['#Product', '#Style'])\n"
                    f"- call_to_action: clear CTA (e.g. 'Shop Now', 'Claim 20% Off')\n"
                    f"- visual_prompt: descriptive prompt for creating a stunning banner graphic"
                )

                response = requests.post(
                    f"{self.api_url}?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt_text}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 800},
                    },
                    timeout=12,
                )

                if response.status_code == 200:
                    data = response.json()
                    raw_content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    # Clean markdown codeblocks if present
                    if raw_content.startswith("```"):
                        raw_content = raw_content.split("```")[1]
                        if raw_content.startswith("json"):
                            raw_content = raw_content[4:]
                        raw_content = raw_content.strip()

                    parsed = json.loads(raw_content)
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini API call failed or timed out: {e}. Using synthesis fallback.")

        # Fallback dynamic local generation
        return self._generate_fallback(product_name, desc_text)

    def _generate_fallback(self, product_name: str, desc_text: str) -> Dict[str, Any]:
        """Local smart fallback generator ensuring instant, realistic ad copy output."""
        cleaned_name = product_name.strip()
        tags = [
            f"#{cleaned_name.replace(' ', '')}",
            "#TrendingNow",
            "#PremiumQuality",
            "#MustHave",
            "#SpecialOffer",
        ]

        return {
            "headline": f"Unlock Next-Level Experience with {cleaned_name}",
            "tagline": f"Redefining quality for {cleaned_name.lower()} lovers.",
            "body_copy": (
                f"Discover why {cleaned_name} is turning heads. Built for excellence—{desc_text.lower() if len(desc_text) < 100 else desc_text[:100] + '...'}. "
                f"Upgrade your routine today with unbeatable value and crafted performance."
            ),
            "hashtags": tags,
            "call_to_action": "Shop Now - Limited Time Offer",
            "visual_prompt": (
                f"A modern glassmorphism ad banner featuring {cleaned_name} on a sleek dark gradient background with vibrant glowing accent lights and bold typography."
            ),
        }


ai_service = AIService()
