import numpy as np
from PIL import Image, ImageDraw
from typing import List

class HandwritingProcessor:
    """
    Handles image preprocessing and rendering of template strokes.
    Ensures both user drawings and templates are normalized identically.
    """

    @staticmethod
    def preprocess(image: Image.Image) -> np.ndarray:
        """
        Processes a PIL Image:
        1. Converts to grayscale.
        2. Crops empty margins.
        3. Resizes to fit in 128x128 keeping aspect ratio.
        4. Centers it on a 128x128 white canvas.
        5. Returns a numpy array.
        """
        gray = image.convert("L")
        arr = np.array(gray)

        # Find non-white pixels (ink threshold < 240)
        ink_coords = np.argwhere(arr < 240)

        if ink_coords.size == 0:
            return np.ones((128, 128), dtype=np.uint8) * 255

        ymin, xmin = ink_coords.min(axis=0)
        ymax, xmax = ink_coords.max(axis=0)

        cropped = arr[ymin:ymax + 1, xmin:xmax + 1]

        h, w = cropped.shape
        target_size = 104
        scale = target_size / max(h, w)
        
        new_h = max(1, int(round(h * scale)))
        new_w = max(1, int(round(w * scale)))

        cropped_pil = Image.fromarray(cropped)
        resized_pil = cropped_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
        resized_arr = np.array(resized_pil)

        canvas = np.ones((128, 128), dtype=np.uint8) * 255

        y_offset = (128 - new_h) // 2
        x_offset = (128 - new_w) // 2
        canvas[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized_arr

        return canvas

    @staticmethod
    def render_template_to_array(strokes: List[List[List[int]]], render_size: int = 512) -> np.ndarray:
        """
        Renders stroke coordinates (from 1024x1024 system) to a high-res PIL image
        and preprocesses it using preprocess() to ensure identical alignment/sizing.
        """
        img = Image.new("L", (render_size, render_size), 255)
        draw = ImageDraw.Draw(img)

        scale = render_size / 1024.0
        brush_width = max(6, int(round(36 * scale)))

        for stroke in strokes:
            scaled_points = []
            for pt in stroke:
                sx = int(round(pt[0] * scale))
                sy = int(round(pt[1] * scale))
                scaled_points.append((sx, sy))

            if len(scaled_points) > 1:
                draw.line(scaled_points, fill=0, width=brush_width, joint="curve")
            elif len(scaled_points) == 1:
                x, y = scaled_points[0]
                r = brush_width // 2
                draw.ellipse([x - r, y - r, x + r, y + r], fill=0)

        return HandwritingProcessor.preprocess(img)

    @staticmethod
    def render_word_template_to_array(stroke_data_list: List[List[List[List[int]]]], render_height: int = 512) -> np.ndarray:
        """
        Renders multiple characters' strokes side-by-side horizontally and runs through preprocess().
        """
        num_chars = len(stroke_data_list)
        if num_chars == 0:
            return np.ones((128, 128), dtype=np.uint8) * 255

        render_width = render_height * num_chars
        img = Image.new("L", (render_width, render_height), 255)
        draw = ImageDraw.Draw(img)

        scale = render_height / 1024.0
        brush_width = max(6, int(round(36 * scale)))

        for i, strokes in enumerate(stroke_data_list):
            offset_x = i * render_height

            for stroke in strokes:
                scaled_points = []
                for pt in stroke:
                    sx = int(round(pt[0] * scale)) + offset_x
                    sy = int(round(pt[1] * scale))
                    scaled_points.append((sx, sy))

                if len(scaled_points) > 1:
                    draw.line(scaled_points, fill=0, width=brush_width, joint="curve")
                elif len(scaled_points) == 1:
                    x, y = scaled_points[0]
                    r = brush_width // 2
                    draw.ellipse([x - r, y - r, x + r, y + r], fill=0)

        return HandwritingProcessor.preprocess(img)
