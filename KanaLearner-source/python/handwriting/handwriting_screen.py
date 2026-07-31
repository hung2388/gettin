import time
import tkinter as tk
import customtkinter as ctk
from PIL import Image, ImageDraw, ImageTk
from typing import Callable, List, Dict, Optional, Tuple
from view.theme import Theme
from .inking_engine import Stroke, StrokePoint, StrokeSmoother, StrokeRenderer

class HandwritingCanvas(ctk.CTkCanvas):
    """
    Professional vector inking canvas styled after Microsoft OneNote.
    Supports vector stroke storage, mouse event gap interpolation,
    Catmull-Rom spline curve rendering, and dual-target PIL export.
    """
    def __init__(self, master, size: int = 280, brush_size: int = 10, **kwargs):
        super().__init__(
            master, 
            width=size, 
            height=size, 
            bg="white", 
            highlightthickness=2, 
            highlightbackground=Theme.BORDER,
            cursor="pencil",
            **kwargs
        )
        self.size = size
        self.brush_size = brush_size
        
        self.image = Image.new("L", (size, size), 255)
        self.draw = ImageDraw.Draw(self.image)
        
        self.completed_strokes: List[Stroke] = []
        self.current_stroke: Optional[Stroke] = None
        
        self.bind("<Button-1>", self._start_stroke)
        self.bind("<B1-Motion>", self._draw_stroke)
        self.bind("<ButtonRelease-1>", self._end_stroke)
        
        self.has_drawing: bool = False
        self.on_draw_callback: Optional[Callable[[], None]] = None

    @property
    def all_strokes(self) -> List[Stroke]:
        return self.completed_strokes

    def _start_stroke(self, event):
        t = time.time()
        self.current_stroke = Stroke()
        self.current_stroke.add_point(event.x, event.y, t)
        
        self._redraw_active_stroke()
        
        if not self.has_drawing:
            self.has_drawing = True
            if self.on_draw_callback:
                self.on_draw_callback()

    def _draw_stroke(self, event):
        if self.current_stroke is None:
            return
            
        t = time.time()
        self.current_stroke.add_point(event.x, event.y, t)
        
        self._redraw_active_stroke()
        
        if not self.has_drawing:
            self.has_drawing = True
            if self.on_draw_callback:
                self.on_draw_callback()

    def _redraw_active_stroke(self):
        """Clears active stroke items and redraws the Catmull-Rom spline curve for current_stroke."""
        if self.current_stroke is None or self.current_stroke.is_empty():
            return
            
        self.delete("active_stroke")
        
        ctrl_pts, spline_pts = StrokeSmoother.process_stroke(self.current_stroke, is_drawing=True)
        
        StrokeRenderer.render_spline_to_canvas(
            self, spline_pts, ctrl_pts, self.brush_size, color="black", tag="active_stroke"
        )

    def _end_stroke(self, event):
        if self.current_stroke is None:
            return

        if not self.current_stroke.is_empty():
            self.completed_strokes.append(self.current_stroke)
            
            ctrl_pts, final_spline = StrokeSmoother.process_stroke(self.current_stroke, is_drawing=False)
            
            StrokeRenderer.render_spline_to_pil(self.draw, final_spline, self.brush_size, fill=0)
            
            self.delete("active_stroke")
            self._render_completed_stroke(self.current_stroke, ctrl_pts, final_spline)
            
        self.current_stroke = None

    def _render_completed_stroke(self, stroke: Stroke, ctrl_pts: List[StrokePoint], final_spline: List[Tuple[float, float]]):
        """Renders a completed stroke onto the canvas with tag 'completed_stroke'."""
        StrokeRenderer.render_spline_to_canvas(
            self, final_spline, ctrl_pts, self.brush_size, color="black", tag="completed_stroke"
        )

    def clear(self):
        """Wipes all vector strokes and resets the memory image."""
        self.delete("all")
        self.completed_strokes.clear()
        self.current_stroke = None
        self.image = Image.new("L", (self.size, self.size), 255)
        self.draw = ImageDraw.Draw(self.image)
        self.has_drawing = False

    def get_image(self) -> Image.Image:
        """Returns the mirror PIL Image representing the user's drawing."""
        return self.image


class HandwritingScreen(ctk.CTkFrame):
    """
    Main Handwriting practice screen UI.
    Contains character selector list, writing workspace canvas, and results panel.
    """
    def __init__(self, master):
        super().__init__(master, fg_color=Theme.BG)
        
        self.category: str = "hiragana"
        self.characters: List[str] = []
        self.char_romaji: Dict[str, str] = {}
        self.current_char: str = ""
        self.sidebar_buttons: Dict[str, ctk.CTkButton] = {}

        self.on_back_callback: Optional[Callable[[], None]] = None
        self.on_check_callback: Optional[Callable[[Image.Image], None]] = None
        self.on_clear_callback: Optional[Callable[[], None]] = None
        self.on_char_select_callback: Optional[Callable[[str], None]] = None
        self.on_next_callback: Optional[Callable[[], None]] = None

        self._build_ui()

    def _build_ui(self):
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=(15, 10))

        self.btn_back = ctk.CTkButton(
            header, text="← Quay lại",
            font=ctk.CTkFont(*Theme.SMALL_BOLD),
            fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
            text_color=Theme.TEXT, corner_radius=8, height=32, width=100,
            command=self._handle_back
        )
        self.btn_back.pack(side="left")

        self.title_label = ctk.CTkLabel(
            header, text="Luyện viết chữ Nhật ✍️",
            font=ctk.CTkFont(*Theme.HEADING),
            text_color=Theme.TEXT
        )
        self.title_label.pack(side="left", padx=20)

        main_container = ctk.CTkFrame(self, fg_color="transparent")
        main_container.pack(fill="both", expand=True, padx=30, pady=(0, 20))
        
        main_container.columnconfigure(0, weight=1)
        main_container.columnconfigure(1, weight=2)
        main_container.rowconfigure(0, weight=1)

        sidebar_frame = ctk.CTkFrame(
            main_container, fg_color=Theme.CARD, corner_radius=16, 
            border_width=1, border_color=Theme.BORDER
        )
        sidebar_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        
        sidebar_title = ctk.CTkLabel(
            sidebar_frame, text="Danh sách chữ cái",
            font=ctk.CTkFont(*Theme.BODY_BOLD),
            text_color=Theme.TEXT_MUTED
        )
        sidebar_title.pack(pady=(12, 6))

        self.scroll_sidebar = ctk.CTkScrollableFrame(
            sidebar_frame, fg_color="transparent",
            scrollbar_button_color=Theme.BORDER,
            scrollbar_button_hover_color=Theme.ACCENT
        )
        self.scroll_sidebar.pack(fill="both", expand=True, padx=10, pady=(0, 12))

        workspace_card = ctk.CTkFrame(
            main_container, fg_color=Theme.BG_GRADIENT, corner_radius=16,
            border_width=1, border_color=Theme.BORDER
        )
        workspace_card.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        workspace_card.pack_propagate(False)

        workspace_inner = ctk.CTkFrame(workspace_card, fg_color="transparent")
        workspace_inner.pack(expand=True, fill="both", padx=20, pady=20)
        
        workspace_inner.columnconfigure(0, weight=1)
        workspace_inner.columnconfigure(1, weight=1)
        workspace_inner.rowconfigure(0, weight=1)

        drawing_panel = ctk.CTkFrame(workspace_inner, fg_color="transparent")
        drawing_panel.grid(row=0, column=0, sticky="nsew", padx=10)
        
        self.prompt_label = ctk.CTkLabel(
            drawing_panel, text="Hãy viết: あ (a)",
            font=ctk.CTkFont("Yu Gothic UI", 26, "bold"),
            text_color=Theme.TEXT
        )
        self.prompt_label.pack(pady=(5, 5))

        self.hint_label = ctk.CTkLabel(
            drawing_panel, text="",
            font=ctk.CTkFont("Yu Gothic UI", 13, "bold"),
            text_color=Theme.GOLD,
            cursor="hand2"
        )
        self.hint_label.pack(pady=(0, 5))

        self.blocks_container = ctk.CTkFrame(drawing_panel, fg_color="transparent")
        self.blocks_container.pack(pady=5, fill="both", expand=True)

        self.canvases: List[HandwritingCanvas] = []
        self.block_status_labels: List[ctk.CTkLabel] = []
        self.block_cards: List[ctk.CTkFrame] = []

        button_row = ctk.CTkFrame(drawing_panel, fg_color="transparent")
        button_row.pack(fill="x", pady=15)

        self.btn_clear = ctk.CTkButton(
            button_row, text="🧹 Xóa",
            font=ctk.CTkFont(*Theme.BODY_BOLD),
            fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
            text_color=Theme.TEXT, corner_radius=8, height=36,
            command=self._handle_clear
        )
        self.btn_clear.pack(side="left", fill="x", expand=True, padx=(0, 6))

        self.btn_check = ctk.CTkButton(
            button_row, text="🔍 Kiểm tra",
            font=ctk.CTkFont(*Theme.BODY_BOLD),
            fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
            text_color="white", corner_radius=8, height=36,
            state="disabled",
            command=self._handle_check
        )
        self.btn_check.pack(side="right", fill="x", expand=True, padx=(6, 0))

        self.feedback_panel = ctk.CTkFrame(
            workspace_inner, fg_color=Theme.CARD, corner_radius=12,
            border_width=1, border_color=Theme.BORDER
        )
        self.feedback_panel.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
        self.feedback_panel.pack_propagate(False)

        self.empty_feedback_lbl = ctk.CTkLabel(
            self.feedback_panel, 
            text="Hãy viết ký tự ở bên trái\nvà nhấn 'Kiểm tra' để đánh giá.",
            font=ctk.CTkFont(*Theme.BODY),
            text_color=Theme.TEXT_MUTED,
            justify="center"
        )
        self.empty_feedback_lbl.pack(expand=True)

        self.results_inner = ctk.CTkFrame(self.feedback_panel, fg_color="transparent")
        
        self.status_banner = ctk.CTkFrame(self.results_inner, fg_color=Theme.SUCCESS_DARK, corner_radius=8)
        self.status_banner.pack(fill="x", pady=(15, 10))
        self.status_lbl = ctk.CTkLabel(
            self.status_banner, text="✅ Chính xác!",
            font=ctk.CTkFont(*Theme.BODY_BOLD),
            text_color="white"
        )
        self.status_lbl.pack(pady=6)

        comp_row = ctk.CTkFrame(self.results_inner, fg_color="transparent")
        comp_row.pack(fill="x", pady=10)
        comp_row.columnconfigure(0, weight=1)
        comp_row.columnconfigure(1, weight=1)

        expected_box = ctk.CTkFrame(comp_row, fg_color=Theme.SURFACE, corner_radius=8)
        expected_box.grid(row=0, column=0, padx=6, sticky="nsew")
        ctk.CTkLabel(expected_box, text="Yêu cầu", font=ctk.CTkFont(*Theme.SMALL_BOLD), text_color=Theme.TEXT_MUTED).pack(pady=4)
        self.expected_char_lbl = ctk.CTkLabel(expected_box, text="あ", font=ctk.CTkFont("Yu Gothic UI", 48, "bold"), text_color=Theme.TEXT)
        self.expected_char_lbl.pack(pady=4)

        detected_box = ctk.CTkFrame(comp_row, fg_color=Theme.SURFACE, corner_radius=8)
        detected_box.grid(row=0, column=1, padx=6, sticky="nsew")
        ctk.CTkLabel(detected_box, text="Dự đoán", font=ctk.CTkFont(*Theme.SMALL_BOLD), text_color=Theme.TEXT_MUTED).pack(pady=4)
        self.detected_char_lbl = ctk.CTkLabel(detected_box, text="あ", font=ctk.CTkFont("Yu Gothic UI", 48, "bold"), text_color=Theme.ACCENT_LIGHT)
        self.detected_char_lbl.pack(pady=4)

        self.score_lbl = ctk.CTkLabel(
            self.results_inner, text="Độ tương đồng: 95%",
            font=ctk.CTkFont(*Theme.SUBHEADING),
            text_color=Theme.GOLD
        )
        self.score_lbl.pack(pady=10)

        self.btn_next = ctk.CTkButton(
            self.results_inner, text="Tiếp theo  ➔",
            font=ctk.CTkFont(*Theme.BODY_BOLD),
            fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
            text_color="white", corner_radius=8, height=40,
            command=self._handle_next
        )
        self.btn_next.pack(fill="x", side="bottom", pady=(0, 15))

    def populate_characters(self, chars: List[str], char_romaji: Dict[str, str], char_meanings: Optional[Dict[str, str]] = None):
        """Populates the sidebar with character cards or word cards."""
        self.characters = chars
        self.char_romaji = char_romaji
        self.char_meanings = char_meanings or {}

        for widget in self.scroll_sidebar.winfo_children():
            widget.destroy()
        self.sidebar_buttons.clear()

        if self.category == "vocab":
            for char in chars:
                romaji = char_romaji.get(char, "")
                meaning = self.char_meanings.get(char, "")
                
                if len(meaning) > 28:
                    meaning = meaning[:25] + "..."
                
                display_text = f"{char}\n{meaning}"
                
                btn = ctk.CTkButton(
                    self.scroll_sidebar,
                    text=display_text,
                    font=ctk.CTkFont("Yu Gothic UI", 12, "bold"),
                    height=45,
                    corner_radius=8,
                    fg_color=Theme.SURFACE,
                    hover_color=Theme.CARD_HOVER,
                    text_color=Theme.TEXT,
                    command=lambda c=char: self._handle_char_click(c)
                )
                btn.pack(fill="x", pady=4, padx=5)
                self.sidebar_buttons[char] = btn
        else:
            cols = 4
            for idx, char in enumerate(chars):
                row = idx // cols
                col = idx % cols
                
                romaji = char_romaji.get(char, "")
                display_text = f"{char}\n{romaji}"

                btn = ctk.CTkButton(
                    self.scroll_sidebar, 
                    text=display_text,
                    font=ctk.CTkFont("Yu Gothic UI", 13, "bold"),
                    width=50,
                    height=50,
                    corner_radius=8,
                    fg_color=Theme.SURFACE,
                    hover_color=Theme.CARD_HOVER,
                    text_color=Theme.TEXT,
                    command=lambda c=char: self._handle_char_click(c)
                )
                btn.grid(row=row, column=col, padx=4, pady=4, sticky="nsew")
                self.sidebar_buttons[char] = btn

    def select_sidebar_highlight(self, char: str):
        """Highlights the active character button in the sidebar."""
        for c, btn in self.sidebar_buttons.items():
            if c == char:
                btn.configure(
                    fg_color=Theme.ACCENT, 
                    border_width=2, 
                    border_color=Theme.GOLD,
                    text_color="white"
                )
            else:
                btn.configure(
                    fg_color=Theme.SURFACE, 
                    border_width=0, 
                    text_color=Theme.TEXT
                )

    def setup_practice_character(self, char: str):
        """Loads a character or word into the practice view."""
        self.current_char = char
        romaji = self.char_romaji.get(char, "")
        
        if self.category == "vocab":
            meaning = self.char_meanings.get(char, "")
            self.prompt_label.configure(text=f"Hãy viết từ: {meaning}")
            self.hint_label.configure(text="💡 Nhấn vào đây để xem gợi ý Kanji/Kana")
            self.hint_label.bind("<Button-1>", lambda _: self._reveal_hint(char, romaji))
        else:
            self.prompt_label.configure(text=f"Hãy viết: {char} ({romaji})")
            self.hint_label.configure(text="")
            self.hint_label.unbind("<Button-1>")

        self.select_sidebar_highlight(char)
        self._build_character_blocks(char)

    def _build_character_blocks(self, word: str):
        """Dynamically creates 1 Block Canvas per character in the target word."""
        for widget in self.blocks_container.winfo_children():
            widget.destroy()
        self.canvases.clear()
        self.block_status_labels.clear()
        self.block_cards.clear()

        target_chars = [c for c in word if c not in (" ", "　")]
        if not target_chars:
            target_chars = [word]

        num_chars = len(target_chars)
        if num_chars == 1:
            canvas_size = 220
            brush_width = 9
        elif num_chars == 2:
            canvas_size = 150
            brush_width = 8
        elif num_chars == 3:
            canvas_size = 120
            brush_width = 7
        else:
            canvas_size = 100
            brush_width = 6

        row_frame = ctk.CTkFrame(self.blocks_container, fg_color="transparent")
        row_frame.pack(anchor="center", expand=True)

        for idx, target_c in enumerate(target_chars):
            card = ctk.CTkFrame(
                row_frame, fg_color=Theme.CARD, corner_radius=12,
                border_width=1, border_color=Theme.BORDER
            )
            card.pack(side="left", padx=5, pady=4)

            lbl_char = ctk.CTkLabel(
                card, text=f"Chữ {idx+1}: {target_c}" if num_chars > 1 else target_c,
                font=ctk.CTkFont("Yu Gothic UI", 14, "bold"),
                text_color=Theme.TEXT
            )
            lbl_char.pack(pady=(6, 2))

            cv_border = ctk.CTkFrame(card, fg_color="white", corner_radius=8, border_width=2, border_color=Theme.BORDER)
            cv_border.pack(padx=6, pady=2)

            canvas = HandwritingCanvas(cv_border, size=canvas_size, brush_size=brush_width)
            canvas.pack(padx=2, pady=2)
            canvas.on_draw_callback = self._on_canvas_drawn

            lbl_status = ctk.CTkLabel(
                card, text="⚪ Chưa vẽ",
                font=ctk.CTkFont("Yu Gothic UI", 10, "bold"),
                text_color=Theme.TEXT_MUTED
            )
            lbl_status.pack(pady=(2, 6))

            self.canvases.append(canvas)
            self.block_status_labels.append(lbl_status)
            self.block_cards.append(card)

        self.btn_check.configure(state="disabled")
        self.results_inner.pack_forget()
        self.empty_feedback_lbl.pack(expand=True)

    def _reveal_hint(self, char: str, romaji: str):
        """Reveals the target spelling/romaji in the prompt."""
        self.hint_label.configure(text=f"Gợi ý: {char} ({romaji})")
        self._handle_clear()

    def display_results(self, expected: str, detected: str, score: float, is_correct: bool, char_results: Optional[List[dict]] = None):
        """Shows evaluation details on the feedback panel."""
        self.empty_feedback_lbl.pack_forget()
        self.results_inner.pack(fill="both", expand=True, padx=15)

        if char_results and len(char_results) == len(self.block_status_labels):
            for idx, cr in enumerate(char_results):
                if cr.get("is_correct"):
                    self.block_status_labels[idx].configure(text="✅ Đúng", text_color=Theme.SUCCESS)
                    self.block_cards[idx].configure(border_color=Theme.SUCCESS)
                else:
                    self.block_status_labels[idx].configure(text="❌ Chưa khớp", text_color=Theme.ERROR)
                    self.block_cards[idx].configure(border_color=Theme.ERROR)

        if is_correct:
            self.status_banner.configure(fg_color=Theme.SUCCESS_DARK)
            self.status_lbl.configure(text="✅ Chính xác!")
        else:
            disp_detected = detected
            if len(detected) > 10:
                disp_detected = detected[:8] + "..."
            self.status_banner.configure(fg_color=Theme.ERROR_DARK)
            self.status_lbl.configure(text=f"❌ Sai rồi! Bạn đã viết: {disp_detected}")

        length = max(len(expected), len(detected))
        if length <= 2:
            fs = 44
        elif length <= 5:
            fs = 20
        elif length <= 9:
            fs = 14
        else:
            fs = 10

        self.expected_char_lbl.configure(text=expected, font=ctk.CTkFont("Yu Gothic UI", fs, "bold"))
        self.detected_char_lbl.configure(
            text=detected if detected != "?" else "Chưa rõ", 
            font=ctk.CTkFont("Yu Gothic UI", fs, "bold")
        )
        
        pct = int(round(score * 100))
        self.score_lbl.configure(text=f"Độ tương đồng trung bình: {pct}%")

    def set_category(self, cat: str):
        """Updates UI title based on choice."""
        self.category = cat
        if cat == "hiragana":
            name = "Hiragana"
        elif cat == "katakana":
            name = "Katakana"
        else:
            name = "Kanji & Từ vựng"
        self.title_label.configure(text=f"Luyện viết chữ {name} ✍️")

    def _on_canvas_drawn(self):
        """Callback triggered whenever drawing happens on any block canvas."""
        any_drawing = False
        for idx, canvas in enumerate(self.canvases):
            if canvas.has_drawing:
                any_drawing = True
                if self.block_status_labels[idx].cget("text") == "⚪ Chưa vẽ":
                    self.block_status_labels[idx].configure(text="✍️ Đã vẽ", text_color=Theme.ACCENT_LIGHT)

        if any_drawing:
            self.btn_check.configure(state="normal")

    def _handle_back(self):
        if self.on_back_callback:
            self.on_back_callback()

    def _handle_clear(self):
        for idx, canvas in enumerate(self.canvases):
            canvas.clear()
            self.block_status_labels[idx].configure(text="⚪ Chưa vẽ", text_color=Theme.TEXT_MUTED)
            self.block_cards[idx].configure(border_color=Theme.BORDER)
        self.btn_check.configure(state="disabled")
        self.results_inner.pack_forget()
        self.empty_feedback_lbl.pack(expand=True)
        if self.on_clear_callback:
            self.on_clear_callback()

    def _handle_check(self):
        if self.on_check_callback:
            images = [cv.get_image() for cv in self.canvases]
            self.on_check_callback(images)

    def _handle_char_click(self, char: str):
        if self.on_char_select_callback:
            self.on_char_select_callback(char)

    def _handle_next(self):
        if self.on_next_callback:
            self.on_next_callback()
