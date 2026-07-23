import os
import uuid
import logging
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from app.core.config import settings

logger = logging.getLogger(__name__)


class BannerService:
    """
    Banner Synthesis Service.
    Generates high-resolution social ad banners (1200x630) using Pillow.
    Combines uploaded product imagery, modern visual styling, and generated headlines.
    """

    def __init__(self):
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_banner(
        self,
        job_id: int,
        product_name: str,
        headline: str,
        tagline: str,
        uploaded_image_path: str | None = None,
    ) -> str:
        """
        Creates a crisp 1200x630 banner image and saves it to disk.
        Returns the web relative URL path (e.g. `/uploads/generated/banner_job_1.png`).
        """
        width, height = 1200, 630
        filename = f"banner_job_{job_id}_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(self.output_dir, filename)

        # Base Canvas (Dark Indigo / Slate Gradient)
        image = Image.new("RGBA", (width, height), (15, 23, 42, 255))
        draw = ImageDraw.Draw(image)

        # Draw decorative background glow circles
        glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_draw.ellipse([800, -100, 1300, 400], fill=(99, 102, 241, 60))  # Indigo glow
        glow_draw.ellipse([-100, 300, 400, 800], fill=(14, 165, 233, 40))  # Sky blue glow
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(80))
        image = Image.alpha_composite(image, glow_layer)
        draw = ImageDraw.Draw(image)

        # Glassmorphism panel outline box for content on left side
        panel_rect = [60, 60, 700, 570]
        panel_bg = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        p_draw = ImageDraw.Draw(panel_bg)
        p_draw.rounded_rectangle(panel_rect, radius=20, fill=(30, 41, 59, 180), outline=(99, 102, 241, 100), width=2)
        image = Image.alpha_composite(image, panel_bg)
        draw = ImageDraw.Draw(image)

        # Try loading system default font or pillow default
        try:
            font_title = ImageFont.truetype("arial.ttf", 38)
            font_sub = ImageFont.truetype("arial.ttf", 22)
            font_badge = ImageFont.truetype("arial.ttf", 14)
        except Exception:
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            font_badge = ImageFont.load_default()

        # Render Badge
        badge_text = "AI GENERATED AD BANNER • MINI CONTENT ENGINE"
        draw.text((100, 95), badge_text, fill=(129, 140, 248, 255), font=font_badge)

        # Render Headline (wrap text if long)
        wrapped_headline = self._wrap_text(headline, max_chars=28)
        draw.text((100, 140), wrapped_headline, fill=(255, 255, 255, 255), font=font_title, spacing=10)

        # Render Tagline
        wrapped_tagline = self._wrap_text(f'"{tagline}"', max_chars=40)
        draw.text((100, 320), wrapped_tagline, fill=(203, 213, 225, 255), font=font_sub, spacing=8)

        # Render CTA button visual box
        draw.rounded_rectangle([100, 460, 340, 515], radius=10, fill=(99, 102, 241, 255))
        draw.text((125, 477), "EXPLORE NOW →", fill=(255, 255, 255, 255), font=font_sub)

        # Process and embed uploaded product image if provided
        if uploaded_image_path:
            full_src_path = uploaded_image_path
            if uploaded_image_path.startswith("/uploads/"):
                full_src_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(uploaded_image_path))

            if os.path.exists(full_src_path):
                try:
                    product_img = Image.open(full_src_path).convert("RGBA")
                    # Resize while keeping ratio to fit inside 380x420 box on the right
                    product_img.thumbnail((380, 420), Image.Resampling.LANCZOS)

                    # Card frame on right side
                    card_rect = [740, 90, 1140, 540]
                    card_bg = Image.new("RGBA", (width, height), (0, 0, 0, 0))
                    c_draw = ImageDraw.Draw(card_bg)
                    c_draw.rounded_rectangle(card_rect, radius=24, fill=(15, 23, 42, 220), outline=(244, 63, 94, 120), width=2)
                    image = Image.alpha_composite(image, card_bg)

                    # Center product image within card
                    pw, ph = product_img.size
                    px = 740 + (400 - pw) // 2
                    py = 90 + (450 - ph) // 2
                    image.paste(product_img, (px, py), product_img)
                    draw = ImageDraw.Draw(image)
                except Exception as e:
                    logger.warning(f"Could not process product image for banner: {e}")
        else:
            # Decorative graphic card on right if no product image uploaded
            card_rect = [740, 90, 1140, 540]
            card_bg = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            c_draw = ImageDraw.Draw(card_bg)
            c_draw.rounded_rectangle(card_rect, radius=24, fill=(30, 41, 59, 200), outline=(99, 102, 241, 150), width=2)
            c_draw.ellipse([840, 200, 1040, 400], fill=(99, 102, 241, 80))
            image = Image.alpha_composite(image, card_bg)
            draw = ImageDraw.Draw(image)
            draw.text((820, 285), product_name[:20], fill=(255, 255, 255, 255), font=font_sub)

        # Convert to RGB and save PNG
        final_rgb = Image.new("RGB", (width, height), (15, 23, 42))
        final_rgb.paste(image, mask=image.split()[3])
        final_rgb.save(file_path, "PNG", quality=95)

        return f"/uploads/generated/{filename}"

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

        return "\n".join(lines[:4])


banner_service = BannerService()
