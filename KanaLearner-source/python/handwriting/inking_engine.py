"""
Professional OneNote-Grade Inking Engine for KanaLearner.
Features:
- Vector stroke storage (Stroke, StrokePoint)
- Mouse event gap interpolation (mandatory for fast Windows mouse moves)
- EMA stabilization & constant spacing (2.5px) resampling
- Catmull-Rom spline curve interpolation
- Velocity prediction
- Debug mode with visual point control display
- Dual-target rendering (Tkinter Canvas + PIL Image)
"""

from __future__ import annotations
import math
import time
from typing import List, Tuple, Optional
from PIL import Image, ImageDraw

# Debug Flag: Set to True to render raw control points (blue) and spline (red)
DEBUG_SHOW_POINTS: bool = False


class StrokePoint:
    """Represents a single raw or interpolated vector point with timestamp."""
    __slots__ = ('x', 'y', 'timestamp')

    def __init__(self, x: float, y: float, timestamp: float = 0.0):
        self.x = float(x)
        self.y = float(y)
        self.timestamp = float(timestamp) if timestamp else time.time()


class Stroke:
    """Vector representation of a single handwritten stroke."""
    def __init__(self, points: Optional[List[StrokePoint]] = None):
        self.points: List[StrokePoint] = points if points is not None else []

    def add_point(self, x: float, y: float, timestamp: float = 0.0):
        self.points.append(StrokePoint(x, y, timestamp))

    def is_empty(self) -> bool:
        return len(self.points) == 0


class StrokeInterpolation:
    """Fills point gaps for skipped Windows MouseMove events and resamples points."""

    @staticmethod
    def interpolate_mouse_gaps(raw_points: List[StrokePoint], max_gap: float = 5.0, spacing: float = 2.5) -> List[StrokePoint]:
        """
        If two consecutive mouse points are > max_gap pixels apart,
        inserts intermediate points so fast mouse movements never create straight segment jumps.
        """
        if not raw_points:
            return []

        interpolated = [raw_points[0]]
        for i in range(1, len(raw_points)):
            p1 = interpolated[-1]
            p2 = raw_points[i]
            dx = p2.x - p1.x
            dy = p2.y - p1.y
            dist = math.hypot(dx, dy)

            if dist > max_gap:
                num_steps = int(math.ceil(dist / spacing))
                dt = (p2.timestamp - p1.timestamp) / num_steps if (p2.timestamp and p1.timestamp) else 0.0
                for step in range(1, num_steps):
                    t = step / float(num_steps)
                    nx = p1.x + t * dx
                    ny = p1.y + t * dy
                    nt = p1.timestamp + t * dt
                    interpolated.append(StrokePoint(nx, ny, nt))

            interpolated.append(p2)
        return interpolated


class StrokeSmoother:
    """
    Smoothing and Catmull-Rom spline interpolation pipeline:
    1. Gap filling (dist > 5px)
    2. EMA stabilization
    3. Equidistant resampling (2.5px)
    4. Velocity prediction
    5. Catmull-Rom spline curve calculation
    """

    @staticmethod
    def filter_and_stabilize(raw_points: List[StrokePoint], alpha: float = 0.75, min_dist: float = 1.5) -> List[StrokePoint]:
        if not raw_points:
            return []
        
        filtered = [raw_points[0]]
        for i in range(1, len(raw_points)):
            p = raw_points[i]
            prev = filtered[-1]
            dx = p.x - prev.x
            dy = p.y - prev.y
            dist = math.hypot(dx, dy)
            
            if dist < min_dist:
                continue
                
            sx = prev.x + alpha * (p.x - prev.x)
            sy = prev.y + alpha * (p.y - prev.y)
            filtered.append(StrokePoint(sx, sy, p.timestamp))
            
        return filtered

    @staticmethod
    def resample(points: List[StrokePoint], spacing: float = 2.5) -> List[StrokePoint]:
        if len(points) < 2:
            return list(points)

        resampled = [points[0]]
        dist_accum = 0.0

        for i in range(len(points) - 1):
            p1 = points[i]
            p2 = points[i + 1]
            dx = p2.x - p1.x
            dy = p2.y - p1.y
            segment_len = math.hypot(dx, dy)
            if segment_len < 1e-5:
                continue

            dt = (p2.timestamp - p1.timestamp) if (p2.timestamp and p1.timestamp) else 0.0

            curr_pos = spacing - dist_accum
            while curr_pos <= segment_len:
                t = curr_pos / segment_len
                nx = p1.x + t * dx
                ny = p1.y + t * dy
                nt = p1.timestamp + t * dt
                resampled.append(StrokePoint(nx, ny, nt))
                curr_pos += spacing

            dist_accum = segment_len - (curr_pos - spacing)

        last_pt = points[-1]
        if math.hypot(resampled[-1].x - last_pt.x, resampled[-1].y - last_pt.y) > 0.5:
            resampled.append(last_pt)

        return resampled

    @staticmethod
    def predict_next_point(points: List[StrokePoint], factor: float = 0.35) -> Optional[StrokePoint]:
        if len(points) < 3:
            return None

        p_last = points[-1]
        p_prev = points[-2]
        p_prev2 = points[-3]

        vx1 = p_last.x - p_prev.x
        vy1 = p_last.y - p_prev.y
        vx0 = p_prev.x - p_prev2.x
        vy0 = p_prev.y - p_prev2.y

        len1 = math.hypot(vx1, vy1)
        len0 = math.hypot(vx0, vy0)

        if len1 < 1.0 or len0 < 1.0:
            return None

        dot = (vx0 * vx1 + vy0 * vy1) / (len0 * len1)
        if dot < 0.5: # Angle > 60 deg -> damp prediction at sharp corners
            return None

        pred_x = p_last.x + vx1 * factor
        pred_y = p_last.y + vy1 * factor
        return StrokePoint(pred_x, pred_y, p_last.timestamp + 0.016)

    @staticmethod
    def catmull_rom_spline(points: List[StrokePoint], steps_per_segment: int = 5) -> List[Tuple[float, float]]:
        if not points:
            return []
        if len(points) == 1:
            return [(points[0].x, points[0].y)]
        if len(points) == 2:
            return [(points[0].x, points[0].y), (points[1].x, points[1].y)]

        pts = [(p.x, p.y) for p in points]
        spline_pts = []

        n = len(pts)
        for i in range(n - 1):
            p0 = pts[max(i - 1, 0)]
            p1 = pts[i]
            p2 = pts[i + 1]
            p3 = pts[min(i + 2, n - 1)]

            steps = steps_per_segment if i < n - 2 else steps_per_segment + 1
            for s in range(steps):
                t = s / float(steps_per_segment)
                t2 = t * t
                t3 = t2 * t

                x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
                y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
                spline_pts.append((x, y))

        return spline_pts

    @classmethod
    def process_stroke(cls, stroke: Stroke, is_drawing: bool = False) -> Tuple[List[StrokePoint], List[Tuple[float, float]]]:
        """
        Full processing pipeline:
        1. Gap insertion for skipped mouse events
        2. EMA stabilization
        3. Equidistant resampling
        4. Optional velocity prediction
        5. Catmull-Rom spline calculation
        """
        if not stroke.points:
            return ([], [])

        if len(stroke.points) == 1:
            pt = stroke.points[0]
            return ([pt], [(pt.x, pt.y)])

        # 1. Gap Insertion
        gaps_filled = StrokeInterpolation.interpolate_mouse_gaps(stroke.points, max_gap=5.0, spacing=2.5)

        # 2. EMA Stabilization
        stabilized = cls.filter_and_stabilize(gaps_filled)

        # 3. Resampling
        resampled = cls.resample(stabilized, spacing=2.5)

        # 4. Velocity Prediction (during active drawing)
        if is_drawing and len(resampled) >= 3:
            pred = cls.predict_next_point(resampled)
            if pred:
                resampled = resampled + [pred]

        # 5. Catmull-Rom Spline
        spline_pts = cls.catmull_rom_spline(resampled, steps_per_segment=5)
        return (resampled, spline_pts)


class StrokeRenderer:
    """Renders Catmull-Rom spline curves to Tkinter canvas and PIL Image."""

    @staticmethod
    def render_spline_to_canvas(canvas, spline_points: List[Tuple[float, float]], raw_points: List[StrokePoint], brush_size: int, color: str = "black", tag: str = "active_stroke"):
        if not spline_points:
            return

        line_color = "red" if DEBUG_SHOW_POINTS else color

        if len(spline_points) == 1:
            x, y = spline_points[0]
            r = max(1, brush_size // 2)
            canvas.create_oval(x - r, y - r, x + r, y + r, fill=line_color, outline=line_color, tags=tag)
        else:
            flat_pts = []
            for x, y in spline_points:
                flat_pts.extend([x, y])

            canvas.create_line(
                flat_pts,
                width=brush_size,
                fill=line_color,
                capstyle="round",
                joinstyle="round",
                tags=tag
            )

        # Debug mode: overlay control points as blue dots
        if DEBUG_SHOW_POINTS and raw_points:
            for p in raw_points:
                pr = 3
                canvas.create_oval(
                    p.x - pr, p.y - pr, p.x + pr, p.y + pr,
                    fill="blue", outline="cyan", tags=tag
                )

    @staticmethod
    def render_spline_to_pil(draw: ImageDraw.ImageDraw, spline_points: List[Tuple[float, float]], brush_size: int, fill: int = 0):
        if not spline_points:
            return

        r = max(1, brush_size // 2)
        if len(spline_points) == 1:
            x, y = spline_points[0]
            draw.ellipse([x - r, y - r, x + r, y + r], fill=fill, outline=fill)
            return

        draw.line(spline_points, fill=fill, width=brush_size, joint="curve")
        
        x0, y0 = spline_points[0]
        x1, y1 = spline_points[-1]
        draw.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=fill, outline=fill)
        draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=fill, outline=fill)
