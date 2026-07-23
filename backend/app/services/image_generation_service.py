import logging
import os
import time
import uuid
from PIL import Image, ImageDraw, ImageFont
from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """
    Image Generation Service Interface.

    Currently acts as a mock image generator for development/testing:
    1. Accepts a generated text-to-image prompt.
    2. Waits for 5 seconds (simulating heavy AI diffusion generation).
    3. Synthesizes a high-quality placeholder image and returns its web URL.

    ARCHITECTURE NOTE:
    To replace this mock with a real ComfyUI workflow (or Stable Diffusion / FLUX API),
    you ONLY need to modify this single file (`image_generation_service.py`).
    """

    def __init__(self):
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_image_from_prompt(self, job_id: int, prompt: str) -> str:
        """
        Generates an image from a detailed text prompt.

        Args:
            job_id: The ID of the job being processed.
            prompt: Detailed text-to-image prompt (from Gemini or user).

        Returns:
            str: Relative web URL path to the generated image (e.g. '/uploads/generated/placeholder_1.png').
        """
        logger.info(f"[ImageGenerationService] Received prompt for Job #{job_id}. Prompt length: {len(prompt)} chars.")
        logger.info(f"[ImageGenerationService] Simulating AI image generation (waiting 5 seconds)...")

        # 1. Wait 5 seconds as specified
        time.sleep(5)

        # 2. Generate crisp 1024x1024 placeholder banner graphic image
        width, height = 1024, 1024
        filename = f"generated_job_{job_id}_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(self.output_dir, filename)

        image = Image.new("RGB", (width, height), (15, 23, 42))  # Dark slate canvas
        draw = ImageDraw.Draw(image)

        # Gradient accents / background aesthetic
        draw.rectangle([0, 0, width, height], fill=(15, 23, 42))
        draw.ellipse([600, -100, 1100, 400], fill=(99, 102, 241))  # Indigo sphere
        draw.ellipse([-100, 600, 400, 1100], fill=(14, 165, 233))  # Sky blue sphere

        # Dark overlay panel
        draw.rounded_rectangle([80, 80, 944, 944], radius=32, fill=(30, 41, 59), outline=(99, 102, 241), width=3)

        try:
            font_title = ImageFont.truetype("arial.ttf", 36)
            font_sub = ImageFont.truetype("arial.ttf", 20)
            font_small = ImageFont.truetype("arial.ttf", 14)
        except Exception:
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            font_small = ImageFont.load_default()

        # Text overlays on placeholder image
        draw.text((120, 140), f"PLACEHOLDER GENERATED IMAGE", fill=(129, 140, 248), font=font_title)
        draw.text((120, 195), f"JOB #{job_id} • SIMULATED FLUX / COMFYUI RENDER", fill=(148, 163, 184), font=font_sub)

        # Draw box displaying prompt preview inside placeholder image
        draw.rounded_rectangle([120, 260, 904, 840], radius=16, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
        draw.text((150, 290), "PROMPT PAYLOAD PASSED TO ENGINE:", fill=(99, 102, 241), font=font_sub)

        wrapped_prompt = self._wrap_text(prompt, max_chars=55)
        draw.text((150, 330), wrapped_prompt, fill=(226, 232, 240), font=font_small, spacing=8)

        draw.text((120, 880), "ComfyUI Integration Ready • Replace image_generation_service.py", fill=(100, 116, 139), font=font_small)

        # Save to disk
        image.save(file_path, "PNG", quality=95)

        web_url = f"/uploads/generated/{filename}"
        logger.info(f"[ImageGenerationService] Placeholder image generated for Job #{job_id}: {web_url}")
        return web_url

    def _wrap_text(self, text: str, max_chars: int) -> str:
        words = text.split()
        lines = []
        current_line = []
        current_len = 0

        for word in words:
            if current_len + len(word) + 1 > max_chars:
                lines.append(" ".join(current_line))
                current_line = [word]
                current_len = len(word)
            else:
                current_line.append(word)
                current_len += len(word) + 1

        if current_line:
            lines.append(" ".join(current_line))

        return "\n".join(lines[:22])


image_generation_service = ImageGenerationService()
