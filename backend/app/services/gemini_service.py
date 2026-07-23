import base64
import logging
import mimetypes
import os
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Service for integrating Google Gemini API to generate detailed visual prompts
    suitable for text-to-image models like FLUX, Stable Diffusion, and ComfyUI.
    """

    def __init__(self):
        self.api_url = (
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        )

    def _get_api_key(self) -> str:
        """Retrieves Gemini API key from settings or environment variables."""
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        return api_key.strip()

    def generate_image_prompt(
        self,
        product_name: str,
        product_description: Optional[str] = None,
        uploaded_image_path: Optional[str] = None,
    ) -> str:
        """
        Sends product name, description, and optional product image to Google Gemini API.
        Returns a detailed text-to-image prompt tailored for FLUX / Stable Diffusion / ComfyUI.

        Raises:
            ValueError: If GEMINI_API_KEY is not configured.
            RuntimeError: If Gemini API request fails or returns an error.
        """
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable in .env"
            )

        desc_text = product_description.strip() if product_description else "No description provided."

        system_instructions = (
            "You are a master AI prompt engineer for text-to-image generators (FLUX.1, Stable Diffusion XL, ComfyUI).\n"
            "Your task is to analyze the product details (and product image if attached) and write a single, highly detailed, "
            "photorealistic, visual generation prompt for creating a stunning commercial ad banner / product showcase photo.\n\n"
            "Format of the prompt:\n"
            "- Subject: Extremely detailed description of the product.\n"
            "- Setting / Environment: Modern studio lighting, background atmosphere, depth of field.\n"
            "- Lighting & Composition: Cinematic lighting, volumetric glow, octanerender style, 8k resolution.\n"
            "- Styling: Professional commercial photography.\n\n"
            "Return ONLY the raw prompt text without markdown quotes or meta-commentary."
        )

        prompt_text = (
            f"{system_instructions}\n\n"
            f"Product Name: {product_name}\n"
            f"Product Description: {desc_text}"
        )

        parts = [{"text": prompt_text}]

        # Process and attach uploaded product image if present
        if uploaded_image_path:
            full_img_path = uploaded_image_path
            if not os.isabs(uploaded_image_path):
                # Resolve path relative to backend directory / UPLOAD_DIR
                if uploaded_image_path.startswith("uploads/") or uploaded_image_path.startswith("/uploads/"):
                    filename = os.path.basename(uploaded_image_path)
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
                    logger.info(f"[GeminiService] Successfully attached image {full_img_path} ({mime_type})")
                except Exception as img_err:
                    logger.warning(f"[GeminiService] Could not read uploaded image for Gemini payload: {img_err}")

        # Construct request payload
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
            },
        }

        try:
            logger.info(f"[GeminiService] Calling Gemini API for product: '{product_name}'...")
            response = requests.post(
                f"{self.api_url}?key={api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30,
            )

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"[GeminiService] API HTTP {response.status_code} Error: {error_detail}")
                raise RuntimeError(
                    f"Gemini API returned status code {response.status_code}: {error_detail}"
                )

            data = response.json()

            # Extract generated prompt from response
            candidates = data.get("candidates", [])
            if not candidates or "content" not in candidates[0]:
                raise RuntimeError(f"Gemini API returned an empty response candidate: {data}")

            generated_text = candidates[0]["content"]["parts"][0]["text"].strip()

            # Clean outer quotes if Gemini returns wrapped text
            if generated_text.startswith('"') and generated_text.endswith('"'):
                generated_text = generated_text[1:-1].strip()

            logger.info(f"[GeminiService] Gemini successfully generated prompt ({len(generated_text)} chars)")
            return generated_text

        except requests.exceptions.RequestException as req_err:
            logger.error(f"[GeminiService] Network connection error calling Gemini API: {req_err}")
            raise RuntimeError(f"Network error communicating with Gemini API: {req_err}")


gemini_service = GeminiService()
