import logging
import os
import time
import urllib.parse
import uuid
import requests
import urllib3
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from typing import Optional
from app.core.config import settings

# Suppress insecure SSL warnings for external image fetching fallbacks
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """
    Image Generation Service Interface (Assignment 1 Requirement).

    Generates realistic photorealistic product lifestyle images using:
    - Option A (Primary): Keyless Free FLUX AI Text-to-Image Generation API (Pollinations / Hugging Face).
    - Option B (Fallback): Realistic product studio scene compositor (PIL).

    MODULARITY:
    Exposes a single interface method: `generate_image(prompt, reference_image)`
    This service is fully isolated and can be swapped with ComfyUI or local FLUX pipelines
    in future assignments without modifying any API routes or worker logic.
    """

    def __init__(self):
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_image(self, prompt: str, reference_image: Optional[str] = None) -> str:
        """
        Primary interface required for Assignment 1.

        Args:
            prompt: Detailed FLUX / Stable Diffusion text-to-image prompt.
            reference_image: Optional path to uploaded product reference image.

        Returns:
            str: Relative URL path to the generated lifestyle PNG/JPEG image file.
        """
        logger.info(f"[ImageGenerationService] Processing prompt ({len(prompt)} chars)...")
        filename = f"lifestyle_{uuid.uuid4().hex[:12]}.jpg"
        destination_path = os.path.join(self.output_dir, filename)

        # 1. Option A: Generate real AI image using FLUX Text-to-Image API
        ai_image_url = self._try_generate_flux_api(prompt, destination_path)
        if ai_image_url:
            return ai_image_url

        # 2. Option B: Fallback - Create realistic composite lifestyle product photograph
        logger.warning("[ImageGenerationService] Option A API unavailable. Executing Option B Composite Studio Engine.")
        return self._generate_composite_lifestyle(prompt, reference_image, destination_path, filename)

    def _try_generate_flux_api(self, prompt: str, destination_path: str) -> Optional[str]:
        """
        Option A: Calls keyless FLUX text-to-image generation engine API.
        Simulates 5-8 seconds synthesis and downloads real generated lifestyle image.
        """
        try:
            logger.info("[ImageGenerationService] Option A: Requesting FLUX AI generation model...")
            # Encode prompt for URL
            clean_prompt = prompt.replace("\n", " ").strip()
            encoded_prompt = urllib.parse.quote(clean_prompt[:400])

            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width=1024&height=1024&model=flux&nologo=true&seed={uuid.uuid4().int % 10000}"
            )

            start_time = time.time()
            response = requests.get(pollinations_url, verify=False, timeout=25)

            # Ensure minimum 5 second realistic AI delay per assignment spec
            elapsed = time.time() - start_time
            if elapsed < 5.0:
                time.sleep(5.0 - elapsed)

            if response.status_code == 200 and len(response.content) > 1000:
                with open(destination_path, "wb") as f:
                    f.write(response.content)

                filename = os.path.basename(destination_path)
                web_url = f"/uploads/generated/{filename}"
                logger.info(f"[ImageGenerationService] Option A FLUX image successfully generated & saved: {web_url}")
                return web_url
            else:
                logger.warning(f"[ImageGenerationService] FLUX API status code {response.status_code}")
                return None

        except Exception as e:
            logger.warning(f"[ImageGenerationService] Option A FLUX API exception: {e}")
            return None

    def _generate_composite_lifestyle(
        self,
        prompt: str,
        reference_image: Optional[str],
        destination_path: str,
        filename: str,
    ) -> str:
        """
        Option B: Composites a realistic studio/dining-room product showcase lifestyle photo.
        """
        width, height = 1024, 1024
        # 1. Base Studio Interior Canvas
        bg = Image.new("RGB", (width, height), (245, 240, 235))  # Warm scandinavian oak studio tone
        draw = ImageDraw.Draw(bg)

        # Draw wooden table surface
        draw.rectangle([0, 520, width, height], fill=(210, 180, 140))
        draw.line([0, 520, width, 520], fill=(160, 120, 80), width=4)

        # Soft sunlight gradient backdrop
        for y in range(520):
            r = int(245 - (y / 520) * 20)
            g = int(240 - (y / 520) * 25)
            b = int(235 - (y / 520) * 30)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Soft sunlight window shadow effect
        window_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        w_draw = ImageDraw.Draw(window_overlay)
        w_draw.polygon([(100, 0), (450, 0), (850, 520), (500, 520)], fill=(255, 255, 255, 35))
        bg.paste(window_overlay, (0, 0), window_overlay)

        # 2. Composite reference product image if available
        if reference_image:
            full_ref_path = reference_image
            if not os.path.isabs(reference_image):
                if reference_image.startswith("uploads/") or reference_image.startswith("/uploads/"):
                    ref_filename = os.path.basename(reference_image)
                    full_ref_path = os.path.join(settings.UPLOAD_DIR, ref_filename)

            if os.path.exists(full_ref_path):
                try:
                    product_img = Image.open(full_ref_path).convert("RGBA")
                    # Resize product image to fit studio focal center
                    product_img.thumbnail((500, 500), Image.Resampling.LANCZOS)
                    pw, ph = product_img.size

                    # Drop Shadow
                    shadow = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0))
                    s_draw = ImageDraw.Draw(shadow)
                    s_draw.ellipse([20, ph - 20, pw + 20, ph + 30], fill=(0, 0, 0, 90))
                    shadow = shadow.filter(ImageFilter.GaussianBlur(15))

                    # Position product on table center
                    pos_x = (width - pw) // 2
                    pos_y = 520 - (ph // 2)

                    bg.paste(shadow, (pos_x - 20, pos_y - 20), shadow)
                    bg.paste(product_img, (pos_x, pos_y), product_img)
                except Exception as comp_err:
                    logger.warning(f"[ImageGenerationService] Composite error: {comp_err}")

        # Save result image
        bg.save(destination_path, "JPEG", quality=92)
        web_url = f"/uploads/generated/{filename}"
        logger.info(f"[ImageGenerationService] Option B composite lifestyle image saved: {web_url}")
        return web_url

    def generate_image_from_prompt(self, job_id: int, prompt: str) -> str:
        """Backwards compatibility alias method."""
        return self.generate_image(prompt=prompt)


image_generation_service = ImageGenerationService()
