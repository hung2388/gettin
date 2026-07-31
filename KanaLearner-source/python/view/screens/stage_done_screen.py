"""
Shown after both parts of a stage are complete.
Premium result card with grade, stats, and celebration.
"""
import customtkinter as ctk
from typing import Callable, Optional

from view.theme import Theme


class StageDoneScreen(ctk.CTkFrame):

    def __init__(self, master):
        super().__init__(master, fg_color=Theme.BG)

        self.on_repeat: Optional[Callable] = None
        self.on_next: Optional[Callable] = None
        self.on_menu: Optional[Callable] = None

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.GOLD, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Center card with glow ─────────────────────────────────────────
        glow = ctk.CTkFrame(self, fg_color=Theme.BG_GRADIENT, corner_radius=24)
        glow.place(relx=0.5, rely=0.5, anchor="center")

        card = ctk.CTkFrame(glow, fg_color=Theme.CARD, corner_radius=20,
                            border_width=1, border_color=Theme.BORDER)
        card.pack(padx=3, pady=3)

        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(padx=60, pady=40)

        # ── Trophy + decoration ───────────────────────────────────────────
        deco = ctk.CTkFrame(inner, fg_color="transparent")
        deco.pack(pady=(0, 8))

        ctk.CTkLabel(deco, text="🌸", font=ctk.CTkFont("Segoe UI Emoji", 28),
                     text_color=Theme.SAKURA).pack(side="left", padx=6)
        ctk.CTkLabel(deco, text="🏆", font=ctk.CTkFont("Segoe UI Emoji", 44),
                     text_color=Theme.GOLD).pack(side="left", padx=6)
        ctk.CTkLabel(deco, text="🌸", font=ctk.CTkFont("Segoe UI Emoji", 28),
                     text_color=Theme.SAKURA).pack(side="left", padx=6)

        # ── Stage label ───────────────────────────────────────────────────
        self.stage_label = ctk.CTkLabel(inner, text="Stage 1 Complete!",
                                        font=ctk.CTkFont(*Theme.HEADING),
                                        text_color=Theme.TEXT)
        self.stage_label.pack(pady=(0, 4))

        # ── Grade badge ───────────────────────────────────────────────────
        self.grade_frame = ctk.CTkFrame(inner, fg_color=Theme.GOLD, corner_radius=16)
        self.grade_frame.pack(pady=(0, 16))
        self.grade_label = ctk.CTkLabel(self.grade_frame, text="S",
                                        font=ctk.CTkFont("Yu Gothic UI", 22, "bold"),
                                        text_color=Theme.BG)
        self.grade_label.pack(padx=20, pady=4)

        # ── Score cards ───────────────────────────────────────────────────
        scores_frame = ctk.CTkFrame(inner, fg_color="transparent")
        scores_frame.pack(fill="x", pady=(0, 4))

        # Part 1 score card
        p1_card = ctk.CTkFrame(scores_frame, fg_color=Theme.SURFACE, corner_radius=10)
        p1_card.pack(fill="x", pady=3)
        p1_inner = ctk.CTkFrame(p1_card, fg_color="transparent")
        p1_inner.pack(fill="x", padx=16, pady=8)

        ctk.CTkLabel(p1_inner, text="📝  Part 1 — Word → Romaji",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color=Theme.TEXT_MUTED, anchor="w").pack(anchor="w")
        self.part1_score = ctk.CTkLabel(p1_inner, text="",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        text_color=Theme.TEXT, anchor="w")
        self.part1_score.pack(anchor="w", pady=(2, 0))

        # Part 2 score card
        p2_card = ctk.CTkFrame(scores_frame, fg_color=Theme.SURFACE, corner_radius=10)
        p2_card.pack(fill="x", pady=3)
        p2_inner = ctk.CTkFrame(p2_card, fg_color="transparent")
        p2_inner.pack(fill="x", padx=16, pady=8)

        ctk.CTkLabel(p2_inner, text="⚡  Part 2 — Speed Typing",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color=Theme.TEXT_MUTED, anchor="w").pack(anchor="w")
        self.part2_score = ctk.CTkLabel(p2_inner, text="",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        text_color=Theme.TEXT, anchor="w")
        self.part2_score.pack(anchor="w", pady=(2, 0))

        # ── Time and missed ───────────────────────────────────────────────
        stats_row = ctk.CTkFrame(inner, fg_color="transparent")
        stats_row.pack(fill="x", pady=(6, 4))

        self.time_label = ctk.CTkLabel(stats_row, text="",
                                       font=ctk.CTkFont(*Theme.BODY_BOLD),
                                       text_color=Theme.WARNING, anchor="w")
        self.time_label.pack(side="left")

        self.missed_label = ctk.CTkLabel(inner, text="",
                                         font=ctk.CTkFont(*Theme.BODY),
                                         text_color=Theme.WARNING)
        self.missed_label.pack(pady=(0, 16))

        # ── Separator ─────────────────────────────────────────────────────
        sep = ctk.CTkFrame(inner, fg_color=Theme.BORDER, height=1, width=360)
        sep.pack(pady=(0, 16))

        # ── Button row ────────────────────────────────────────────────────
        btn_row = ctk.CTkFrame(inner, fg_color="transparent")
        btn_row.pack()

        btn_repeat = ctk.CTkButton(btn_row, text="↺  Repeat Stage",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                   text_color=Theme.TEXT, corner_radius=10, height=42, width=150,
                                   command=lambda: self.on_repeat() if self.on_repeat else None)
        btn_repeat.pack(side="left", padx=6)

        btn_next = ctk.CTkButton(btn_row, text="Next Stage  →",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                 text_color="white", corner_radius=10, height=42, width=150,
                                 command=lambda: self.on_next() if self.on_next else None)
        btn_next.pack(side="left", padx=6)

        btn_menu = ctk.CTkButton(inner, text="←  Main Menu",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color="transparent", hover_color=Theme.SURFACE,
                                 text_color=Theme.TEXT_MUTED, corner_radius=10, height=36, width=140,
                                 border_width=1, border_color=Theme.BORDER,
                                 command=lambda: self.on_menu() if self.on_menu else None)
        btn_menu.pack(pady=(10, 0))

    # ── API ───────────────────────────────────────────────────────────────

    def populate(self, stage_num: int,
                 p1_correct: int, p1_total: int,
                 p2_correct: int, p2_total: int, p2_wrong: int,
                 elapsed_sec: int, missed_count: int):

        self.stage_label.configure(text=f"Stage {stage_num} Complete! 🎌")

        p1_pct = (p1_correct * 100 // p1_total) if p1_total > 0 else 0
        p2_pct = (p2_correct * 100 // p2_total) if p2_total > 0 else 0

        # Grade calculation
        avg_pct = (p1_pct + p2_pct) // 2
        grade, grade_color = self._calculate_grade(avg_pct)
        self.grade_label.configure(text=grade)
        self.grade_frame.configure(fg_color=grade_color)

        self.part1_score.configure(
            text=f"{p1_correct}/{p1_total} correct  ({p1_pct}%)")
        self.part2_score.configure(
            text=f"{p2_correct}/{p2_total} correct, {p2_wrong} mistakes  ({p2_pct}%)")

        # Format time
        mins = elapsed_sec // 60
        secs = elapsed_sec % 60
        self.time_label.configure(text=f"⏱  Time: {mins}m {secs:02d}s")

        if missed_count == 0:
            self.missed_label.configure(text="🌟 Perfect Part 1 — no mistakes!",
                                        text_color=Theme.SUCCESS)
        else:
            self.missed_label.configure(
                text=f"⚠ {missed_count} word(s) missed in Part 1.",
                text_color=Theme.WARNING)

        excellent = p1_pct >= 90 and p2_pct >= 80
        self.stage_label.configure(text_color=Theme.GOLD if excellent else Theme.TEXT)

    @staticmethod
    def _calculate_grade(avg_pct: int) -> tuple:
        if avg_pct >= 95:
            return "S ★", Theme.GOLD
        elif avg_pct >= 85:
            return "A", "#4CAF50"
        elif avg_pct >= 70:
            return "B", "#2196F3"
        elif avg_pct >= 50:
            return "C", "#FF9800"
        else:
            return "D", "#E53935"

    def set_on_repeat(self, cb: Callable):
        self.on_repeat = cb

    def set_on_next(self, cb: Callable):
        self.on_next = cb

    def set_on_menu(self, cb: Callable):
        self.on_menu = cb
