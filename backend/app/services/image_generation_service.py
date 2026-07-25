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

# Absolute path to the backend root (directory containing 'app/')
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _resolve_image_path(relative_or_abs: str) -> str:
    """
    Converts a stored image path like '/uploads/product_abc.jpg'
    or 'uploads/product_abc.jpg' into an absolute filesystem path
    anchored from the backend root directory — works on any server CWD.
    """
    if os.path.isabs(relative_or_abs) and os.path.exists(relative_or_abs):
        return relative_or_abs

    filename = os.path.basename(relative_or_abs)

    # Primary: resolve relative to backend root (works on Render / any CWD)
    abs_path = os.path.join(_BACKEND_ROOT, settings.UPLOAD_DIR, filename)
    if os.path.exists(abs_path):
        return abs_path

    # Fallback 1: CWD-relative
    cwd_path = os.path.join(os.getcwd(), settings.UPLOAD_DIR, filename)
    if os.path.exists(cwd_path):
        return cwd_path

    # Fallback 2: raw path as-is stripped of leading slash
    stripped = relative_or_abs.lstrip("/")
    if os.path.exists(stripped):
        return stripped

    logger.warning(f"[resolve_image_path] Cannot find image: {relative_or_abs} (tried {abs_path}, {cwd_path})")
    return abs_path  # return best guess so caller can log the specific failure


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
        """
        Studio composite lifestyle image engine.
        Places the actual uploaded product image into a premium warm studio scene
        with realistic shadow, soft bokeh background, and cinematic lighting.
        """
        import math
        import random as rnd

        width, height = 1024, 768
        bg = Image.new("RGB", (width, height), (30, 22, 18))
        draw = ImageDraw.Draw(bg)

        # ── Warm gradient background (top: warm taupe → bottom: deep walnut) ──
        for y in range(height):
            t = y / height
            r = int(200 - t * 80)
            g = int(180 - t * 90)
            b = int(155 - t * 80)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # ── Soft bokeh circles in background (out-of-focus ambient orbs) ──
        bokeh_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(bokeh_layer)
        rnd.seed(42)
        for _ in range(18):
            bx = rnd.randint(0, width)
            by = rnd.randint(0, height // 2)
            br = rnd.randint(40, 120)
            alpha = rnd.randint(18, 50)
            color = rnd.choice([
                (255, 200, 100, alpha), (255, 160, 60, alpha),
                (255, 230, 140, alpha), (210, 180, 120, alpha),
            ])
            b_draw.ellipse([bx - br, by - br, bx + br, by + br], fill=color)
        bokeh_layer = bokeh_layer.filter(ImageFilter.GaussianBlur(35))
        bg = bg.convert("RGBA")
        bg = Image.alpha_composite(bg, bokeh_layer)
        bg = bg.convert("RGB")
        draw = ImageDraw.Draw(bg)

        # ── Wooden surface / tabletop (lower 35% of image) ──
        table_y = int(height * 0.62)
        for y in range(table_y, height):
            t = (y - table_y) / (height - table_y)
            r = int(110 + t * 30)
            g = int(72 + t * 20)
            b = int(40 + t * 10)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Wood grain lines
        for i in range(0, height - table_y, 14):
            grain_y = table_y + i + rnd.randint(-2, 2)
            alpha_val = rnd.randint(15, 40)
            draw.line([(0, grain_y), (width, grain_y)], fill=(80, 50, 25), width=1)

        # Table edge highlight
        draw.line([(0, table_y), (width, table_y)], fill=(180, 140, 90), width=3)
        draw.line([(0, table_y + 1), (width, table_y + 1)], fill=(220, 185, 130), width=1)

        # ── Cinematic warm key-light beam from upper-right ──
        light_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        l_draw = ImageDraw.Draw(light_layer)
        l_draw.ellipse([width // 2, -100, width + 200, height // 2], fill=(255, 210, 120, 22))
        light_layer = light_layer.filter(ImageFilter.GaussianBlur(60))
        bg = bg.convert("RGBA")
        bg = Image.alpha_composite(bg, light_layer)
        bg = bg.convert("RGB")
        draw = ImageDraw.Draw(bg)

        # ── Vignette (dark edges for cinematic feel) ──
        vignette = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        v_draw = ImageDraw.Draw(vignette)
        for r in range(max(width, height), 0, -2):
            alpha = max(0, int(130 * (1 - (r / max(width, height)) ** 1.5)))
            v_draw.ellipse(
                [width // 2 - r, height // 2 - r, width // 2 + r, height // 2 + r],
                outline=(0, 0, 0, alpha),
            )
        vignette = vignette.filter(ImageFilter.GaussianBlur(20))
        bg = bg.convert("RGBA")
        bg = Image.alpha_composite(bg, vignette)
        bg = bg.convert("RGB")

        # ── Place the actual uploaded product image as the hero subject ──
        if reference_image:
            full_ref_path = _resolve_image_path(reference_image)
            logger.info(f"[CompositeEngine] Resolved product image path: {full_ref_path} (exists={os.path.exists(full_ref_path)})")

            if os.path.exists(full_ref_path):
                try:
                    product_img = Image.open(full_ref_path).convert("RGBA")

                    # Scale product to fill ~55% of image height, keep aspect ratio
                    max_product_h = int(height * 0.55)
                    max_product_w = int(width * 0.60)
                    product_img.thumbnail((max_product_w, max_product_h), Image.Resampling.LANCZOS)
                    pw, ph = product_img.size

                    # Center the product horizontally, sit it on the table surface
                    pos_x = (width - pw) // 2
                    pos_y = table_y - ph + int(ph * 0.12)  # slightly overlap table edge

                    # ── Drop shadow beneath product ──
                    shadow_w, shadow_h = pw + 80, 60
                    shadow = Image.new("RGBA", (shadow_w, shadow_h), (0, 0, 0, 0))
                    s_draw = ImageDraw.Draw(shadow)
                    s_draw.ellipse([0, 0, shadow_w, shadow_h], fill=(0, 0, 0, 110))
                    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
                    shadow_x = pos_x - 40
                    shadow_y = table_y - 20
                    bg_rgba = bg.convert("RGBA")
                    bg_rgba.paste(shadow, (shadow_x, shadow_y), shadow)

                    # ── Subtle warm glow halo around product ──
                    glow_layer = Image.new("RGBA", (pw + 120, ph + 120), (0, 0, 0, 0))
                    g_draw = ImageDraw.Draw(glow_layer)
                    g_draw.ellipse([10, 10, pw + 110, ph + 110], fill=(255, 200, 100, 30))
                    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(25))
                    bg_rgba.paste(glow_layer, (pos_x - 60, pos_y - 60), glow_layer)

                    # ── Paste actual product image ──
                    bg_rgba.paste(product_img, (pos_x, pos_y), product_img)
                    bg = bg_rgba.convert("RGB")

                except Exception as comp_err:
                    logger.warning(f"[ImageGenerationService] Composite error: {comp_err}")

        bg.save(destination_path, "JPEG", quality=95)
        web_url = f"/uploads/generated/{filename}"
        return web_url


    def generate_image_from_prompt(self, job_id: int, prompt: str) -> str:
        """Backwards compatibility alias method."""
        url, _ = self.generate_image(prompt=prompt)
        return url


image_generation_service = ImageGenerationService()
