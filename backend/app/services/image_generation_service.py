import logging
import os
import time
import urllib.parse
import uuid
import requests
import urllib3
from PIL import Image, ImageDraw, ImageFilter
from typing import Optional, Tuple, Dict, Any
from app.core.config import settings

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """
    Image Generation Service Interface (Assignment 2 Requirement).

    Delegates image generation to ComfyUIService:
    - Replaces Assignment 1 mock service with ComfyUI Img2Img workflow engine.
    - Exposes single method: `generate_image(prompt, reference_image)` -> Tuple[str, dict]
    - Exposes FLUX/Composite helper methods for standalone testing & fallback execution.
    """

    def __init__(self):
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_image(self, prompt: str, reference_image: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Primary interface method replaced for Assignment 2.

        Args:
            prompt: Detailed FLUX / Stable Diffusion text-to-image prompt.
            reference_image: Optional path to uploaded product reference image.

        Returns:
            Tuple[str, Dict[str, Any]]: (image_url, metadata_dict)
        """
        from app.services.comfyui_service import comfyui_service
        logger.info("[ImageGenerationService] Routing image generation request to ComfyUIService...")
        return comfyui_service.generate_image(prompt=prompt, reference_image=reference_image)

    def _try_generate_flux_api(self, prompt: str, destination_path: str) -> Optional[str]:
        """Option A: FLUX API generation engine helper."""
        try:
            clean_prompt = prompt.replace("\n", " ").strip()
            encoded_prompt = urllib.parse.quote(clean_prompt[:400])

            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width=1024&height=1024&model=flux&nologo=true&seed={uuid.uuid4().int % 10000}"
            )

            start_time = time.time()
            response = requests.get(pollinations_url, verify=False, timeout=25)

            elapsed = time.time() - start_time
            if elapsed < 5.0:
                time.sleep(5.0 - elapsed)

            if response.status_code == 200 and len(response.content) > 1000:
                with open(destination_path, "wb") as f:
                    f.write(response.content)

                filename = os.path.basename(destination_path)
                web_url = f"/uploads/generated/{filename}"
                return web_url
            return None

        except Exception as e:
            logger.warning(f"[ImageGenerationService] FLUX API fallback exception: {e}")
            return None

    def _generate_composite_lifestyle(
        self,
        prompt: str,
        reference_image: Optional[str],
        destination_path: str,
        filename: str,
    ) -> str:
        """Option B: Studio composite lifestyle fallback engine."""
        width, height = 1024, 1024
        bg = Image.new("RGB", (width, height), (245, 240, 235))
        draw = ImageDraw.Draw(bg)

        draw.rectangle([0, 520, width, height], fill=(210, 180, 140))
        draw.line([0, 520, width, 520], fill=(160, 120, 80), width=4)

        for y in range(520):
            r = int(245 - (y / 520) * 20)
            g = int(240 - (y / 520) * 25)
            b = int(235 - (y / 520) * 30)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        if reference_image:
            full_ref_path = reference_image
            if not os.path.isabs(reference_image):
                if reference_image.startswith("uploads/") or reference_image.startswith("/uploads/"):
                    ref_filename = os.path.basename(reference_image)
                    full_ref_path = os.path.join(settings.UPLOAD_DIR, ref_filename)

            if os.path.exists(full_ref_path):
                try:
                    product_img = Image.open(full_ref_path).convert("RGBA")
                    product_img.thumbnail((500, 500), Image.Resampling.LANCZOS)
                    pw, ph = product_img.size

                    shadow = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0))
                    s_draw = ImageDraw.Draw(shadow)
                    s_draw.ellipse([20, ph - 20, pw + 20, ph + 30], fill=(0, 0, 0, 90))
                    shadow = shadow.filter(ImageFilter.GaussianBlur(15))

                    pos_x = (width - pw) // 2
                    pos_y = 520 - (ph // 2)

                    bg.paste(shadow, (pos_x - 20, pos_y - 20), shadow)
                    bg.paste(product_img, (pos_x, pos_y), product_img)
                except Exception as comp_err:
                    logger.warning(f"[ImageGenerationService] Composite error: {comp_err}")

        bg.save(destination_path, "JPEG", quality=92)
        web_url = f"/uploads/generated/{filename}"
        return web_url

    def generate_image_from_prompt(self, job_id: int, prompt: str) -> str:
        """Backwards compatibility alias method."""
        url, _ = self.generate_image(prompt=prompt)
        return url


image_generation_service = ImageGenerationService()
