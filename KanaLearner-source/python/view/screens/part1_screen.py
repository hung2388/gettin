"""
Part 1 – show one Japanese word, user types the romaji.
Auto-advances instantly. Shows non-blocking toast on wrong answer (10s).
Enhanced with visual feedback (green flash correct, red flash wrong).
"""
import customtkinter as ctk
from typing import Callable, Optional

from data.word_data import WordEntry
from view.theme import Theme


class Part1Screen(ctk.CTkFrame):

    def __init__(self, master):
        super().__init__(master, fg_color=Theme.BG)

        self.on_answer: Optional[Callable] = None
        self._toast_after_id: Optional[str] = None
        self._flash_after_id: Optional[str] = None
        self._suppressing_trace = False

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Top bar ───────────────────────────────────────────────────────
        top_bar = ctk.CTkFrame(self, fg_color="transparent")
        top_bar.pack(fill="x", padx=40, pady=(16, 0))

        self.stage_label = ctk.CTkLabel(top_bar, text="Stage 1 · Part 1",
                                        font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                        text_color=Theme.ACCENT_LIGHT, anchor="w")
        self.stage_label.pack(side="left")

        self.question_num = ctk.CTkLabel(top_bar, text="Question 1 / 20",
                                         font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                         text_color=Theme.TEXT_MUTED, anchor="e")
        self.question_num.pack(side="right")

        # ── Toast label (styled notification bar) ─────────────────────────
        self.toast_frame = ctk.CTkFrame(self, fg_color=Theme.ERROR_DARK, corner_radius=8,
                                        height=0)
        self.toast_frame.pack(fill="x", padx=40, pady=(8, 0))
        self.toast_frame.pack_forget()  # Hidden initially

        self.toast_label = ctk.CTkLabel(self.toast_frame, text="",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        text_color="white")
        self.toast_label.pack(padx=16, pady=8)

        # ── Main card ─────────────────────────────────────────────────────
        card_glow = ctk.CTkFrame(self, fg_color=Theme.BG_GRADIENT, corner_radius=24)
        card_glow.pack(expand=True, padx=50, pady=(10, 10))

        self.card = ctk.CTkFrame(card_glow, fg_color=Theme.CARD, corner_radius=20,
                                 border_width=1, border_color=Theme.BORDER)
        self.card.pack(padx=3, pady=3, fill="both", expand=True)

        card_inner = ctk.CTkFrame(self.card, fg_color="transparent")
        card_inner.pack(expand=True, padx=60, pady=30)

        # Part indicator
        part_badge = ctk.CTkFrame(card_inner, fg_color=Theme.ACCENT, corner_radius=12)
        part_badge.pack(pady=(0, 16))
        ctk.CTkLabel(part_badge, text="📝  Word → Romaji",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color="white").pack(padx=16, pady=4)

        self.word_display = ctk.CTkLabel(card_inner, text="",
                                         font=ctk.CTkFont(*Theme.KANA_LARGE),
                                         text_color=Theme.TEXT)
        self.word_display.pack(pady=(0, 4))

        self.meaning_label = ctk.CTkLabel(card_inner, text="",
                                          font=ctk.CTkFont(*Theme.BODY),
                                          text_color=Theme.TEXT_MUTED)
        self.meaning_label.pack(pady=(0, 20))

        # Input area with decorative frame
        input_container = ctk.CTkFrame(card_inner, fg_color=Theme.SURFACE,
                                       corner_radius=12, border_width=2,
                                       border_color=Theme.ACCENT)
        input_container.pack()

        input_inner = ctk.CTkFrame(input_container, fg_color="transparent")
        input_inner.pack(padx=4, pady=4)

        hint_label = ctk.CTkLabel(input_inner, text="⌨  Type the romaji reading",
                                  font=ctk.CTkFont(*Theme.SMALL),
                                  text_color=Theme.TEXT_MUTED)
        hint_label.pack(pady=(4, 2))

        self.input_var = ctk.StringVar()
        self.input_field = ctk.CTkEntry(input_inner, textvariable=self.input_var,
                                        font=ctk.CTkFont(*Theme.MONO),
                                        text_color=Theme.TEXT,
                                        fg_color=Theme.BG_GRADIENT,
                                        border_color=Theme.ACCENT,
                                        border_width=0,
                                        justify="center",
                                        width=240, height=44)
        self.input_field.pack(pady=(0, 4))

        # ── Bottom ────────────────────────────────────────────────────────
        bottom = ctk.CTkFrame(self, fg_color="transparent")
        bottom.pack(fill="x", padx=40, pady=(0, 24))

        self.progress_bar = ctk.CTkProgressBar(bottom, progress_color=Theme.ACCENT,
                                                fg_color=Theme.SURFACE,
                                                height=6, width=500,
                                                corner_radius=3)
        self.progress_bar.set(0)
        self.progress_bar.pack(pady=(0, 10))

        score_strip = ctk.CTkFrame(bottom, fg_color="transparent")
        score_strip.pack()

        self.correct_label = ctk.CTkLabel(score_strip, text="✓ 0",
                                          font=ctk.CTkFont(*Theme.SUBHEADING),
                                          text_color=Theme.SUCCESS)
        self.correct_label.pack(side="left", padx=20)

        self.wrong_label = ctk.CTkLabel(score_strip, text="✗ 0",
                                        font=ctk.CTkFont(*Theme.SUBHEADING),
                                        text_color=Theme.ERROR)
        self.wrong_label.pack(side="left", padx=20)

        # ── Input trace ───────────────────────────────────────────────────
        self.input_var.trace_add("write", self._on_input_change)

    # ── API ───────────────────────────────────────────────────────────────

    def set_stage_label(self, text: str):
        self.stage_label.configure(text=text)

    def show_question(self, entry: WordEntry, q_num: int, total: int):
        self.word_display.configure(text=entry.word, text_color=Theme.TEXT)
        meaning_text = f"「{entry.meaning}」" if entry.meaning else ""
        self.meaning_label.configure(text=meaning_text)
        self.question_num.configure(text=f"Question {q_num} / {total}")

        # Reset input field
        self._suppressing_trace = True
        self.input_var.set("")
        self._suppressing_trace = False

        # Reset card border
        self.card.configure(border_color=Theme.BORDER)
        if self._flash_after_id:
            self.after_cancel(self._flash_after_id)

        self.input_field.focus_set()

    def show_toast(self, message: str):
        self.toast_label.configure(text=message)
        self.toast_frame.pack(fill="x", padx=40, pady=(8, 0), before=self.card.master)

        # Flash card border red
        self.card.configure(border_color=Theme.ERROR, border_width=2)
        if self._flash_after_id:
            self.after_cancel(self._flash_after_id)
        self._flash_after_id = self.after(800, lambda: self.card.configure(border_color=Theme.BORDER, border_width=1))

        if self._toast_after_id:
            self.after_cancel(self._toast_after_id)
        self._toast_after_id = self.after(10000, self._hide_toast)

    def flash_correct(self):
        """Green flash on correct answer."""
        self.card.configure(border_color=Theme.SUCCESS, border_width=2)
        if self._flash_after_id:
            self.after_cancel(self._flash_after_id)
        self._flash_after_id = self.after(400, lambda: self.card.configure(border_color=Theme.BORDER, border_width=1))

    def _hide_toast(self):
        self.toast_frame.pack_forget()
        self.toast_label.configure(text="")

    def update_score(self, correct: int, wrong: int):
        self.correct_label.configure(text=f"✓ {correct}")
        self.wrong_label.configure(text=f"✗ {wrong}")

    def set_progress(self, value: int, maximum: int):
        if maximum > 0:
            self.progress_bar.set(value / maximum)
        else:
            self.progress_bar.set(0)

    def set_on_answer(self, cb: Callable):
        self.on_answer = cb

    # ── Internals ─────────────────────────────────────────────────────────

    def _on_input_change(self, *_args):
        if self._suppressing_trace:
            return
        text = self.input_var.get()
        if text and self.on_answer:
            self.after_idle(lambda: self.on_answer(text))
