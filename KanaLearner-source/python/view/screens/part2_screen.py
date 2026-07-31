"""
Part 2 – Speed Typing.
Shows kana sequence; user types romaji continuously.
Enhanced with visual polish.
"""
import customtkinter as ctk
from typing import Callable, List, Optional

from data.kana_data import KanaEntry
from view.theme import Theme


class Part2Screen(ctk.CTkFrame):

    def __init__(self, master):
        super().__init__(master, fg_color=Theme.BG)

        self.sequence: List[KanaEntry] = []
        self.current_index: int = 0
        self.kana_labels: List[ctk.CTkLabel] = []
        self.on_word: Optional[Callable] = None
        self._timer_after_id: Optional[str] = None
        self._feedback_after_id: Optional[str] = None
        self._suppressing_trace = False

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.TEAL, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Top bar ───────────────────────────────────────────────────────
        top_bar = ctk.CTkFrame(self, fg_color="transparent")
        top_bar.pack(fill="x", padx=36, pady=(14, 0))

        left_group = ctk.CTkFrame(top_bar, fg_color="transparent")
        left_group.pack(side="left")

        self.stage_label = ctk.CTkLabel(left_group, text="Stage 1 · Part 2",
                                        font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                        text_color=Theme.TEAL)
        self.stage_label.pack(side="left", padx=(0, 16))

        self.round_label = ctk.CTkLabel(left_group, text="Round 1 / 10",
                                        font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                        text_color=Theme.TEXT_MUTED)
        self.round_label.pack(side="left")

        right_group = ctk.CTkFrame(top_bar, fg_color="transparent")
        right_group.pack(side="right")

        # Stats with icons
        self.correct_label = ctk.CTkLabel(right_group, text="✓ 0",
                                          font=ctk.CTkFont(*Theme.BODY_BOLD),
                                          text_color=Theme.SUCCESS)
        self.correct_label.pack(side="left", padx=10)

        self.wrong_label = ctk.CTkLabel(right_group, text="✗ 0",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        text_color=Theme.ERROR)
        self.wrong_label.pack(side="left", padx=10)

        self.timer_label = ctk.CTkLabel(right_group, text="⏱ 0s",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        text_color=Theme.WARNING)
        self.timer_label.pack(side="left", padx=10)

        # ── Part badge ────────────────────────────────────────────────────
        badge_row = ctk.CTkFrame(self, fg_color="transparent")
        badge_row.pack(pady=(8, 6))
        badge = ctk.CTkFrame(badge_row, fg_color=Theme.TEAL, corner_radius=12)
        badge.pack()
        ctk.CTkLabel(badge, text="⚡ Speed Typing",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color="white").pack(padx=14, pady=3)

        # ── Sequence card ─────────────────────────────────────────────────
        seq_card = ctk.CTkFrame(self, fg_color=Theme.CARD, corner_radius=14,
                                border_width=1, border_color=Theme.BORDER)
        seq_card.pack(fill="x", padx=36, pady=(0, 8))

        seq_header = ctk.CTkLabel(seq_card, text="Kana Sequence",
                                  font=ctk.CTkFont(*Theme.SMALL),
                                  text_color=Theme.TEXT_MUTED, anchor="w")
        seq_header.pack(anchor="w", padx=14, pady=(8, 2))

        self.sequence_frame = ctk.CTkFrame(seq_card, fg_color="transparent")
        self.sequence_frame.pack(fill="both", padx=12, pady=(0, 10))

        # ── Target card ───────────────────────────────────────────────────
        target_glow = ctk.CTkFrame(self, fg_color=Theme.BG_GRADIENT, corner_radius=20)
        target_glow.pack(padx=60, pady=(4, 6))

        self.target_card = ctk.CTkFrame(target_glow, fg_color=Theme.CARD, corner_radius=16,
                                        border_width=1, border_color=Theme.BORDER)
        self.target_card.pack(padx=3, pady=3)

        target_inner = ctk.CTkFrame(self.target_card, fg_color="transparent")
        target_inner.pack(padx=60, pady=16)

        self.current_kana = ctk.CTkLabel(target_inner, text="",
                                         font=ctk.CTkFont(*Theme.KANA_MEDIUM),
                                         text_color=Theme.HIGHLIGHT)
        self.current_kana.pack()


        input_prompt = ctk.CTkLabel(target_inner,
                                    text="Type romaji — auto-advances on correct",
                                    font=ctk.CTkFont(*Theme.SMALL),
                                    text_color=Theme.TEXT_MUTED)
        input_prompt.pack(pady=(10, 4))

        self.input_var = ctk.StringVar()
        self.input_field = ctk.CTkEntry(target_inner, textvariable=self.input_var,
                                        font=ctk.CTkFont(*Theme.MONO),
                                        text_color=Theme.TEXT,
                                        fg_color=Theme.BG_GRADIENT,
                                        border_color=Theme.TEAL,
                                        border_width=2,
                                        justify="center",
                                        width=240, height=44)
        self.input_field.pack()

        self.feedback_label = ctk.CTkLabel(target_inner, text="",
                                           font=ctk.CTkFont(*Theme.BODY_BOLD),
                                           text_color=Theme.ERROR, height=24)
        self.feedback_label.pack(pady=(4, 0))

        # ── Progress bar ──────────────────────────────────────────────────
        self.progress_bar = ctk.CTkProgressBar(self, progress_color=Theme.TEAL,
                                                fg_color=Theme.SURFACE,
                                                height=6, width=500,
                                                corner_radius=3)
        self.progress_bar.set(0)
        self.progress_bar.pack(pady=(4, 16))

        # ── Input trace ───────────────────────────────────────────────────
        self.input_var.trace_add("write", self._on_input_change)

    # ── API ───────────────────────────────────────────────────────────────

    def set_stage_label(self, text: str):
        self.stage_label.configure(text=text)

    def init_sequence(self, seq: List[KanaEntry], current_round: int, total_rounds: int):
        self.sequence = seq
        self.current_index = 0

        self.round_label.configure(text=f"Round {current_round} / {total_rounds}")
        self.feedback_label.configure(text="")

        self._build_sequence_labels()
        self._highlight_current()

        self._suppressing_trace = True
        self.input_var.set("")
        self._suppressing_trace = False
        self.input_field.focus_set()

    def advance_to(self, index: int, was_correct: bool):
        if index > 0 and index - 1 < len(self.kana_labels):
            color = Theme.SUCCESS if was_correct else Theme.ERROR
            self.kana_labels[index - 1].configure(text_color=color)
        self.current_index = index
        self._update_progress()
        self._highlight_current()

        # Flash border green
        self.target_card.configure(border_color=Theme.SUCCESS, border_width=2)
        self.after(300, lambda: self.target_card.configure(border_color=Theme.BORDER, border_width=1))

        self._suppressing_trace = True
        self.input_var.set("")
        self._suppressing_trace = False
        self.feedback_label.configure(text="")
        self.input_field.focus_set()

    def advance_after_wrong(self, index: int):
        if index > 0 and index - 1 < len(self.kana_labels):
            self.kana_labels[index - 1].configure(text_color=Theme.ERROR)
        self.current_index = index
        self._update_progress()
        self._highlight_current()

        # Flash border red
        self.target_card.configure(border_color=Theme.ERROR, border_width=2)
        self.after(500, lambda: self.target_card.configure(border_color=Theme.BORDER, border_width=1))

        self._suppressing_trace = True
        self.input_var.set("")
        self._suppressing_trace = False
        self.feedback_label.configure(text="✗ Wrong", text_color=Theme.ERROR)
        self.input_field.focus_set()

        if self._feedback_after_id:
            self.after_cancel(self._feedback_after_id)
        self._feedback_after_id = self.after(600, lambda: self.feedback_label.configure(text=""))

    def update_stats(self, correct: int, wrong: int):
        self.correct_label.configure(text=f"✓ {correct}")
        self.wrong_label.configure(text=f"✗ {wrong}")

    def update_timer(self, seconds: int):
        mins = seconds // 60
        secs = seconds % 60
        self.timer_label.configure(text=f"⏱ {mins}:{secs:02d}")

    def start_timer(self, tick_callback: Callable):
        self.stop_timer()
        def tick():
            tick_callback()
            self._timer_after_id = self.after(1000, tick)
        self._timer_after_id = self.after(1000, tick)

    def stop_timer(self):
        if self._timer_after_id:
            self.after_cancel(self._timer_after_id)
            self._timer_after_id = None

    def set_on_word(self, cb: Callable):
        self.on_word = cb

    # ── Internals ─────────────────────────────────────────────────────────

    def _build_sequence_labels(self):
        for widget in self.sequence_frame.winfo_children():
            widget.destroy()
        self.kana_labels = []

        cols = 14
        for i, entry in enumerate(self.sequence):
            row = i // cols
            col = i % cols
            lbl = ctk.CTkLabel(self.sequence_frame, text=entry.kana,
                               font=ctk.CTkFont(*Theme.KANA_SMALL),
                               text_color=Theme.TEXT_MUTED)
            lbl.grid(row=row, column=col, padx=3, pady=2)
            self.kana_labels.append(lbl)

    def _highlight_current(self):
        if not self.sequence or self.current_index >= len(self.sequence):
            return

        for i, lbl in enumerate(self.kana_labels):
            if i == self.current_index:
                lbl.configure(text_color=Theme.HIGHLIGHT,
                              font=ctk.CTkFont(*Theme.KANA_SMALL_BOLD))
            elif i > self.current_index:
                lbl.configure(text_color=Theme.TEXT_MUTED,
                              font=ctk.CTkFont(*Theme.KANA_SMALL))

        entry = self.sequence[self.current_index]
        self.current_kana.configure(text=entry.kana)

    def _update_progress(self):
        if self.sequence:
            self.progress_bar.set(self.current_index / len(self.sequence))
        else:
            self.progress_bar.set(0)

    def _on_input_change(self, *_args):
        if self._suppressing_trace:
            return
        text = self.input_var.get().strip()
        if text and self.on_word:
            self.on_word(text)
