import base64
import logging
import mimetypes
import os
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiPromptService:
    """
    Service responsible for analyzing product metadata (Name, Description, Uploaded Image)
    and generating detailed visual prompts optimized for FLUX, Stable Diffusion, and ComfyUI.
    """

    def __init__(self):
        self.api_url = (
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        )

    def _get_api_key(self) -> str:
        """Retrieves Gemini API key from settings or environment variables."""
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        return api_key.strip()

    def generate_prompt(
        self,
        product_name: str,
        product_description: Optional[str] = None,
        reference_image: Optional[str] = None,
    ) -> str:
        """
        Sends product details and optional product image to Google Gemini API.
        Returns a detailed prompt optimized for text-to-image AI generators.

        Args:
            product_name: Name of the product.
            product_description: Optional detailed description.
            reference_image: Optional path to uploaded product image.

        Returns:
            str: Detailed text-to-image prompt.
        """
        api_key = self._get_api_key()
        if not api_key:
            logger.warning("[GeminiPromptService] GEMINI_API_KEY not set. Using smart AI prompt fallback.")
            return self._build_fallback_prompt(product_name, product_description)

        desc_text = product_description.strip() if product_description else "No description provided."

        system_instructions = (
            "You are an expert AI prompt engineer for commercial product photography and text-to-image diffusion models (FLUX.1, SDXL, ComfyUI).\n"
            "Your job is to analyze the product name, description, and attached product image, and generate a single, highly detailed, photorealistic prompt for generating a high-end commercial ad lifestyle photograph of this product.\n\n"
            "Include:\n"
            "- Subject details (materials, texture, colors, finish)\n"
            "- Setting & Environment (luxurious studio / lifestyle setting, props)\n"
            "- Lighting & Atmosphere (soft natural sunlight, volumetric glow, cinematic lighting, 8k resolution, octanerender style)\n\n"
            "Return ONLY the raw prompt text."
        )

        prompt_text = (
            f"{system_instructions}\n\n"
            f"Product Name: {product_name}\n"
            f"Product Description: {desc_text}"
        )

        parts = [{"text": prompt_text}]

        # Attach reference image if provided
        if reference_image:
            full_img_path = reference_image
            if not os.path.isabs(reference_image):
                if reference_image.startswith("uploads/") or reference_image.startswith("/uploads/"):
                    filename = os.path.basename(reference_image)
                    full_img_path = os.path.join(settings.UPLOAD_DIR, filename)

            if os.path.exists(full_img_path):
                try:
                    mime_type, _ = mimetypes.guess_type(full_img_path)
                    if not mime_type:
                        mime_type = "image/jpeg"

                    with open(full_img_path, "rb") as img_file:
                        encoded_bytes = base64.b64encode(img_file.read()).decode("utf-8")

                    parts.append({
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": encoded_bytes,
                        }
                    })
                    logger.info(f"[GeminiPromptService] Successfully attached reference image {full_img_path}")
                except Exception as img_err:
                    logger.warning(f"[GeminiPromptService] Could not attach image: {img_err}")

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
            },
        }

        try:
            logger.info(f"[GeminiPromptService] Generating prompt for product: '{product_name}'...")
            response = requests.post(
                f"{self.api_url}?key={api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30,
            )

            if response.status_code != 200:
                logger.error(f"[GeminiPromptService] HTTP {response.status_code} Error: {response.text}")
                return self._build_fallback_prompt(product_name, product_description)

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates or "content" not in candidates[0]:
                return self._build_fallback_prompt(product_name, product_description)

            generated_text = candidates[0]["content"]["parts"][0]["text"].strip()
            if generated_text.startswith('"') and generated_text.endswith('"'):
                generated_text = generated_text[1:-1].strip()

            logger.info(f"[GeminiPromptService] Prompt generated successfully ({len(generated_text)} chars)")
            return generated_text

        except Exception as err:
            logger.error(f"[GeminiPromptService] Gemini API call exception ({err}). Using fallback.")
            return self._build_fallback_prompt(product_name, product_description)

    def _build_fallback_prompt(self, product_name: str, product_description: Optional[str]) -> str:
        """Constructs a high quality prompt fallback."""
        desc = f" ({product_description.strip()})" if product_description else ""
        return (
            f"High-end commercial lifestyle photograph of {product_name}{desc}. "
            f"Set in a modern luxury Scandinavian interior with soft natural window sunlight, "
            f"organic wooden background, subtle volumetric lighting, shallow depth of field, 8k resolution, "
            f"octanerender style, crisp textures, professional e-commerce product showcase photo."
        )


gemini_prompt_service = GeminiPromptService()
