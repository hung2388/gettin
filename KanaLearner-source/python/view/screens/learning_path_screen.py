"""
Learning Path Screen – Interactive skill tree map replacing selection screen.
Provides a canvas-based graph of rounded nodes and smooth connection curves.
"""
import customtkinter as ctk
from typing import Callable, Dict, Optional

from view.theme import Theme


class LearningPathScreen(ctk.CTkFrame):

    # Skill tree node coordinates & styling information
    NODES_DATA = {
        "hiragana": {"name": "Hiragana", "emoji": "🌸", "x": 400, "y": 85},
        "katakana": {"name": "Katakana", "emoji": "🎌", "x": 400, "y": 205},
        "pack_00": {"name": "Gói từ vựng 0", "emoji": "🔢", "x": 400, "y": 325},
        "pack_01": {"name": "Gói từ vựng 1", "emoji": "🎒", "x": 400, "y": 445},
        "pack_02": {"name": "Gói từ vựng 2", "emoji": "🛍️", "x": 400, "y": 565},
        "pack_03": {"name": "Gói từ vựng 3", "emoji": "🍱", "x": 400, "y": 685},
    }

    def __init__(self, master):
        super().__init__(master, fg_color=Theme.BG)

        self.on_node_click: Optional[Callable[[str, str], None]] = None
        self.on_vocab_hub_click: Optional[Callable[[], None]] = None
        self.progress_getter: Optional[Callable[[str], str]] = None
        self.raw_progress_getter: Optional[Callable[[], Dict[str, float]]] = None

        self.drag_start_x = 0
        self.drag_start_y = 0

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Header Dashboard (Sticky at the top) ──────────────────────────
        self.dashboard = ctk.CTkFrame(self, fg_color=Theme.CARD, corner_radius=12,
                                      border_width=1, border_color=Theme.BORDER)
        self.dashboard.pack(fill="x", padx=30, pady=(15, 10))

        dash_inner = ctk.CTkFrame(self.dashboard, fg_color="transparent")
        dash_inner.pack(fill="x", padx=20, pady=12)

        # Left: App title & subtitle
        title_group = ctk.CTkFrame(dash_inner, fg_color="transparent")
        title_group.pack(side="left")

        title = ctk.CTkLabel(title_group, text="Lộ trình học tiếng Nhật 🎌",
                             font=ctk.CTkFont("Yu Gothic UI", 20, "bold"),
                             text_color=Theme.TEXT)
        title.pack(anchor="w")

        subtitle = ctk.CTkLabel(title_group, text="Hoàn thành các bài học để mở khóa chủ đề tiếp theo",
                                font=ctk.CTkFont(*Theme.SMALL),
                                text_color=Theme.TEXT_MUTED)
        subtitle.pack(anchor="w")

        # Center/Right: Vocabulary Hub button
        self.btn_vocab_hub = ctk.CTkButton(dash_inner, text="📚 Kho từ vựng",
                                           font=ctk.CTkFont(*Theme.BODY_BOLD),
                                           fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                           text_color="white", corner_radius=10, width=130, height=36,
                                           command=self._on_vocab_hub_click)
        self.btn_vocab_hub.pack(side="right", padx=(20, 10))

        # Right: Progress indicators
        self.progress_group = ctk.CTkFrame(dash_inner, fg_color="transparent")
        self.progress_group.pack(side="right")

        self.progress_lbl = ctk.CTkLabel(self.progress_group, text="Tiến độ: 0/6 Bài học (0%)",
                                         font=ctk.CTkFont(*Theme.BODY_BOLD),
                                         text_color=Theme.TEXT)
        self.progress_lbl.pack(anchor="e", pady=(0, 4))

        self.overall_progress_bar = ctk.CTkProgressBar(self.progress_group, progress_color=Theme.SUCCESS,
                                                       fg_color=Theme.SURFACE, height=8, width=220,
                                                       corner_radius=4)
        self.overall_progress_bar.set(0)
        self.overall_progress_bar.pack(anchor="e")

        # ── Map container with Canvas ─────────────────────────────────────
        # Frame holding the scrollable canvas
        self.canvas_container = ctk.CTkFrame(self, fg_color=Theme.BG_GRADIENT, corner_radius=16,
                                             border_width=1, border_color=Theme.BORDER)
        self.canvas_container.pack(fill="both", expand=True, padx=30, pady=(0, 20))

        # Native Tkinter Canvas for vector drawings (curved lines and custom node shapes)
        self.canvas = ctk.CTkCanvas(self.canvas_container, bg=Theme.BG_GRADIENT,
                                    bd=0, highlightthickness=0,
                                    scrollregion=(0, 0, 800, 800))
        self.canvas.pack(fill="both", expand=True, padx=4, pady=4)

        # Bind panning & scrolling events
        self.canvas.bind("<ButtonPress-1>", self._on_press)
        self.canvas.bind("<B1-Motion>", self._on_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_release)
        self.canvas.bind("<MouseWheel>", self._on_mousewheel)

        # Hover bind on tags
        self.canvas.tag_bind("node", "<Enter>", self._on_node_enter)
        self.canvas.tag_bind("node", "<Leave>", self._on_node_leave)

    # ── API ───────────────────────────────────────────────────────────────

    def set_progress_getters(self, status_cb: Callable[[str], str], raw_cb: Callable[[], Dict[str, float]]):
        self.progress_getter = status_cb
        self.raw_progress_getter = raw_cb
        self.refresh_map()

    def set_on_node_click(self, cb: Callable[[str, str], None]):
        self.on_node_click = cb

    def set_on_vocab_hub_click(self, cb: Callable[[], None]):
        self.on_vocab_hub_click = cb

    def _on_vocab_hub_click(self):
        if self.on_vocab_hub_click:
            self.on_vocab_hub_click()

    def refresh_map(self):
        """Redraws all nodes, connection curves, and updates the header stats."""
        self.canvas.delete("all")

        # 1. Update stats
        if self.raw_progress_getter:
            prog_dict = self.raw_progress_getter()
            total_nodes = len(self.NODES_DATA)
            completed_count = sum(1 for k, v in prog_dict.items() if k in self.NODES_DATA and v >= 100.0)
            overall_pct = int((completed_count / total_nodes) * 100) if total_nodes > 0 else 0
            self.progress_lbl.configure(text=f"Tiến độ: {completed_count}/{total_nodes} Bài học ({overall_pct}%)")
            self.overall_progress_bar.set(completed_count / total_nodes if total_nodes > 0 else 0)

        # 2. Draw connections first (so nodes display on top of lines)
        self._draw_connections()

        # 3. Draw nodes
        for key, node in self.NODES_DATA.items():
            cx, cy = node["x"], node["y"]
            status = self.progress_getter(key) if self.progress_getter else "available"

            # Assign colors based on node status
            if status == "completed":
                bg_color = "#1B3B2B"  # Dark forest green
                border_color = Theme.SUCCESS  # Green
                text_color = Theme.TEXT
                status_text = "✓ Hoàn thành"
                status_color = Theme.SUCCESS
            elif status == "in_progress":
                bg_color = Theme.CARD
                border_color = Theme.ACCENT  # Glowing blue
                text_color = Theme.TEXT
                status_text = "• Đang học"
                status_color = Theme.ACCENT_LIGHT
            else:  # available or default
                bg_color = Theme.CARD
                border_color = Theme.TEXT_MUTED  # White/silver border
                text_color = Theme.TEXT
                status_text = "○ Sẵn sàng"
                status_color = Theme.TEXT_MUTED

            # Draw rounded background
            self._draw_rounded_node(cx, cy, 146, 92, 12, bg_color, border_color, key)

            # Draw icon
            self.canvas.create_text(cx, cy - 18, text=node["emoji"],
                                    font=("Segoe UI Emoji", 22), fill=text_color,
                                    tags=(key, "node"))

            # Draw display name
            self.canvas.create_text(cx, cy + 12, text=node["name"],
                                    font=("Yu Gothic UI", 11, "bold"), fill=text_color,
                                    tags=(key, "node"))

            # Draw status label
            self.canvas.create_text(cx, cy + 30, text=status_text,
                                    font=("Yu Gothic UI", 8), fill=status_color,
                                    tags=(key, "node"))

    # ── Draw Helpers ──────────────────────────────────────────────────────

    def _draw_rounded_node(self, cx, cy, w, h, r, bg, border, tag):
        """Draws a rounded rectangle using a smoothed polygon for premium aesthetic."""
        x1 = cx - w/2
        y1 = cy - h/2
        x2 = cx + w/2
        y2 = cy + h/2
        points = [
            x1 + r, y1,
            x1 + r, y1,
            x2 - r, y1,
            x2 - r, y1,
            x2, y1,
            x2, y1 + r,
            x2, y1 + r,
            x2, y2 - r,
            x2, y2 - r,
            x2, y2,
            x2 - r, y2,
            x2 - r, y2,
            x1 + r, y2,
            x1 + r, y2,
            x1, y2,
            x1, y2 - r,
            x1, y2 - r,
            x1, y1 + r,
            x1, y1 + r,
            x1, y1
        ]
        # Draw background shadow
        self.canvas.create_polygon(points, fill=bg, outline=border, width=2, smooth=True, tags=(tag, "node", "bg"))

    def _draw_connections(self):
        """Draws smooth Bezier/curved paths connecting the topics."""
        # 1. Hiragana -> Katakana
        self._draw_curve_line("hiragana", "katakana", [(400, 85), (400, 205)])

        # 2. Katakana -> Pack 00
        self._draw_curve_line("katakana", "pack_00", [(400, 205), (400, 325)])

        # 3. Pack 00 -> Pack 01
        self._draw_curve_line("pack_00", "pack_01", [(400, 325), (400, 445)])

        # 4. Pack 01 -> Pack 02
        self._draw_curve_line("pack_01", "pack_02", [(400, 445), (400, 565)])

        # 5. Pack 02 -> Pack 03
        self._draw_curve_line("pack_02", "pack_03", [(400, 565), (400, 685)])

    def _get_link_color(self, parent_key: str, child_key: str) -> str:
        """Determines connection line color based on completion status."""
        if not self.progress_getter:
            return Theme.BORDER

        p_status = self.progress_getter(parent_key)
        c_status = self.progress_getter(child_key)

        if p_status == "completed" and c_status == "completed":
            return Theme.SUCCESS  # Green
        else:
            return Theme.ACCENT  # Unlocked by default

    def _draw_curve_line(self, parent_key: str, child_key: str, points: list):
        """Draws a smooth curve line."""
        color = self._get_link_color(parent_key, child_key)
        # flatten points
        flat = []
        for x, y in points:
            flat.extend([x, y])
        self.canvas.create_line(flat, fill=color, width=3, smooth=True)

    def _draw_trunk_line(self, y_start, y_end):
        """Draws the central trunk line."""
        if not self.progress_getter:
            color = Theme.BORDER
        else:
            color = Theme.SUCCESS if self.progress_getter("numbers") == "completed" else Theme.ACCENT

        self.canvas.create_line(400, y_start, 400, y_end, fill=color, width=4)

    def _draw_side_branch(self, parent_key: str, child_key: str, y: int, is_left: bool):
        """Draws a curved branch coming off the trunk and going horizontally into the node."""
        color = self._get_link_color(parent_key, child_key)
        if is_left:
            # Curve down from trunk to left
            # Points: (400, y-30) -> (400, y) -> (380, y) -> (220, y)
            pts = [400, y - 25, 400, y, 380, y, 220, y]
        else:
            # Curve down from trunk to right
            # Points: (400, y-30) -> (400, y) -> (420, y) -> (580, y)
            pts = [400, y - 25, 400, y, 420, y, 580, y]

        self.canvas.create_line(pts, fill=color, width=3, smooth=True)

    # ── Interaction Handlers ──────────────────────────────────────────────

    def _on_press(self, event):
        self.drag_start_x = event.x
        self.drag_start_y = event.y
        self.canvas.scan_mark(event.x, event.y)

    def _on_drag(self, event):
        self.canvas.scan_dragto(event.x, event.y, gain=1)

    def _on_release(self, event):
        dx = abs(event.x - self.drag_start_x)
        dy = abs(event.y - self.drag_start_y)
        # If click displacement is minimal, evaluate it as a click
        if dx < 5 and dy < 5:
            clicked_ids = self.canvas.find_withtag("current")
            if clicked_ids:
                tags = self.canvas.gettags(clicked_ids[0])
                for tag in tags:
                    if tag in self.NODES_DATA:
                        self._handle_node_click(tag)
                        break

    def _on_mousewheel(self, event):
        # Allow vertical scrolling using the mouse wheel
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def _handle_node_click(self, node_key: str):
        node = self.NODES_DATA[node_key]
        if self.on_node_click:
            self.on_node_click(node_key, node["name"])

    # ── Hover Effects ─────────────────────────────────────────────────────

    def _on_node_enter(self, event):
        self.canvas.config(cursor="hand2")
        # Glow effect: update outline border of the bg polygon
        clicked_ids = self.canvas.find_withtag("current")
        if clicked_ids:
            tags = self.canvas.gettags(clicked_ids[0])
            for tag in tags:
                if tag in self.NODES_DATA:
                    # Find all items of this tag, change the outline width to 3
                    for item in self.canvas.find_withtag(tag):
                        if "bg" in self.canvas.gettags(item):
                            self.canvas.itemconfigure(item, width=3.5)

    def _on_node_leave(self, event):
        self.canvas.config(cursor="")
        clicked_ids = self.canvas.find_withtag("current")
        if clicked_ids:
            tags = self.canvas.gettags(clicked_ids[0])
            for tag in tags:
                if tag in self.NODES_DATA:
                    for item in self.canvas.find_withtag(tag):
                        if "bg" in self.canvas.gettags(item):
                            self.canvas.itemconfigure(item, width=2)
