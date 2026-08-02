"""
Level 5 Screen - Speed Typing.
Shuffles word list, evaluates romaji input character-by-character, 
auto-advances on correct input without Enter, and displays statistics.
"""
import random
import time
import customtkinter as ctk
from typing import Callable, List, Optional
from data.word_data import WordEntry, VocabPack
from view.theme import Theme
from view.screens.vocab_study_hub_screen import speak_japanese_async


class Level5Screen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.pack: Optional[VocabPack] = None
        
        # State
        self.sequence: List[WordEntry] = []
        self.current_index: int = 0
        self.word_labels: List[ctk.CTkLabel] = []
        
        self.correct_count: int = 0
        self.wrong_count: int = 0
        self.start_time: float = 0.0
        self.timer_after_id: Optional[str] = None
        self.feedback_after_id: Optional[str] = None

        self.on_back: Optional[Callable] = None

        # ── UI Elements ──
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.TEAL, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(15, 5))

        self.btn_back = ctk.CTkButton(header, text="← Quay lại",
                                      font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                      fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                      text_color=Theme.TEXT, corner_radius=8, height=32, width=100,
                                      command=self._handle_back)
        self.btn_back.pack(side="left")

        self.lbl_title = ctk.CTkLabel(header, text="Level 5: Luyện gõ tốc độ",
                                      font=ctk.CTkFont(*Theme.HEADING), text_color=Theme.TEXT)
        self.lbl_title.pack(side="right", padx=10)

        # Main Workspace Container
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True, padx=40, pady=10)

        # Stats strip
        stats_strip = ctk.CTkFrame(self.main_container, fg_color="transparent")
        stats_strip.pack(fill="x", pady=5)

        self.lbl_correct = ctk.CTkLabel(stats_strip, text="✓ 0",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.SUCCESS)
        self.lbl_correct.pack(side="left", padx=15)

        self.lbl_wrong = ctk.CTkLabel(stats_strip, text="✗ 0",
                                      font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.ERROR)
        self.lbl_wrong.pack(side="left", padx=15)

        self.lbl_timer = ctk.CTkLabel(stats_strip, text="⏱ 00:00",
                                      font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.WARNING)
        self.lbl_timer.pack(side="right", padx=15)

        # Sequence strip (Scrollable list at top)
        seq_card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=12,
                                border_width=1, border_color=Theme.BORDER)
        seq_card.pack(fill="x", pady=10)

        self.scroll_seq = ctk.CTkScrollableFrame(seq_card, fg_color="transparent", height=40, orientation="horizontal")
        self.scroll_seq.pack(fill="both", expand=True, padx=10, pady=5)

        # Big Word & Spacious Input Card
        self.word_card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=16,
                                      border_width=1, border_color=Theme.BORDER)
        self.word_card.pack(fill="both", expand=True, pady=10)

        card_inner = ctk.CTkFrame(self.word_card, fg_color="transparent")
        card_inner.pack(expand=True, padx=40, pady=20)

        self.lbl_current_word = ctk.CTkLabel(card_inner, text="日本語",
                                             font=ctk.CTkFont("Yu Gothic UI", 48, "bold"), text_color=Theme.HIGHLIGHT)
        self.lbl_current_word.pack(pady=5)

        # Spacious, Extra Wide Input Box to prevent text cuts
        self.input_container = ctk.CTkFrame(card_inner, fg_color=Theme.SURFACE,
                                            corner_radius=12, border_width=2,
                                            border_color=Theme.TEAL)
        self.input_container.pack(pady=20)

        self.input_var = ctk.StringVar()
        self.input_field = ctk.CTkEntry(self.input_container, textvariable=self.input_var,
                                        font=ctk.CTkFont("Yu Gothic UI", 20, "bold"),
                                        text_color=Theme.TEXT,
                                        fg_color=Theme.BG_GRADIENT,
                                        border_color=Theme.TEAL,
                                        border_width=0,
                                        justify="center",
                                        width=440, height=50)  # Extended width to fit long words
        self.input_field.pack(padx=4, pady=4)
        self.input_field.bind("<space>", self._on_space_pressed)

        # Progress bar
        self.progress_bar = ctk.CTkProgressBar(self.main_container, progress_color=Theme.TEAL,
                                               fg_color=Theme.SURFACE, height=6, corner_radius=3)
        self.progress_bar.set(0)
        self.progress_bar.pack(fill="x", pady=15)

    def set_pack(self, pack_id: str, selected_words: Optional[List[WordEntry]] = None):
        self.pack = self.model.get_vocab_pack(pack_id)
        if not self.pack or not self.pack.words:
            self._handle_back()
            return

        if selected_words:
            self.sequence = list(selected_words)
        else:
            self.sequence = list(self.pack.words)
        random.shuffle(self.sequence)
        
        self.current_index = 0
        self.correct_count = 0
        self.wrong_count = 0
        
        self.lbl_title.configure(text=f"{self.pack.name} · Level 5 ({len(self.sequence)} từ)")
        
        # Build sequence labels
        self._build_seq_labels()
        
        # Start game timers
        self.start_time = time.time()
        self._start_timer()

        self._show_current_word()

    def set_on_back(self, cb: Callable):
        self.on_back = cb

    def _handle_back(self):
        self._stop_timer()
        if self.on_back:
            self.on_back()

    def _build_seq_labels(self):
        for w in self.scroll_seq.winfo_children(): w.destroy()
        self.word_labels = []

        for i, word in enumerate(self.sequence):
            lbl = ctk.CTkLabel(self.scroll_seq, text=word.word,
                               font=ctk.CTkFont("Yu Gothic UI", 14),
                               text_color=Theme.TEXT_MUTED)
            lbl.pack(side="left", padx=10)
            self.word_labels.append(lbl)

    def _show_current_word(self):
        if self.current_index >= len(self.sequence):
            self._finish_game()
            return

        word = self.sequence[self.current_index]
        self.lbl_current_word.configure(text=word.word)

        # Update sequence highlights
        for i, lbl in enumerate(self.word_labels):
            if i == self.current_index:
                lbl.configure(text_color=Theme.HIGHLIGHT, font=ctk.CTkFont("Yu Gothic UI", 14, "bold"))
            elif i < self.current_index:
                lbl.configure(text_color=Theme.SUCCESS, font=ctk.CTkFont("Yu Gothic UI", 14))
            else:
                lbl.configure(text_color=Theme.TEXT_MUTED, font=ctk.CTkFont("Yu Gothic UI", 14))

        self.input_var.set("")
        self.input_container.configure(border_color=Theme.TEAL)
        self.progress_bar.set(self.current_index / len(self.sequence))

        self.input_field.focus_set()

    def _on_space_pressed(self, event):
        if self.current_index >= len(self.sequence):
            return "break"

        typed = self.input_var.get().strip().lower()
        if not typed:
            return "break"

        word = self.sequence[self.current_index]
        correct_romaji = word.romaji.lower().strip()

        if typed == correct_romaji:
            # Correct! Play TTS, flash green and advance
            self.correct_count += 1
            self.lbl_correct.configure(text=f"✓ {self.correct_count}")
            self.input_container.configure(border_color=Theme.SUCCESS)
            speak_japanese_async(word.word)

            self.current_index += 1
            # Brief delay before moving next to show correct color
            self.after(200, self._show_current_word)
        else:
            # Incorrect
            self.wrong_count += 1
            self.lbl_wrong.configure(text=f"✗ {self.wrong_count}")
            self.input_container.configure(border_color=Theme.ERROR)
            
            # Reset typed input to give another try
            self.input_var.set("")

        return "break"  # Prevent space character insertion in input field

    def _start_timer(self):
        self._stop_timer()
        def _tick():
            elapsed = int(time.time() - self.start_time)
            mins = elapsed // 60
            secs = elapsed % 60
            self.lbl_timer.configure(text=f"⏱ {mins:02d}:{secs:02d}")
            self.timer_after_id = self.after(1000, _tick)
        _tick()

    def _stop_timer(self):
        if self.timer_after_id:
            self.after_cancel(self.timer_after_id)
            self.timer_after_id = None

    def _finish_game(self):
        self._stop_timer()
        
        # Update progress in model to 100%
        if self.pack:
            self.model.progress[self.pack.id] = 100.0
            self.model.save_progress()

        for w in self.main_container.winfo_children():
            w.destroy()

        summary_card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=16,
                                     border_width=1, border_color=Theme.BORDER)
        summary_card.pack(expand=True, fill="both", padx=40, pady=20)

        inner = ctk.CTkFrame(summary_card, fg_color="transparent")
        inner.pack(expand=True)

        badge = ctk.CTkFrame(inner, fg_color=Theme.GOLD, corner_radius=12)
        badge.pack(pady=(0, 16))
        ctk.CTkLabel(badge, text="🏆 HOÀN THÀNH LEVEL 5",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color="black").pack(padx=16, pady=4)

        title = ctk.CTkLabel(inner, text="Tốc Độ Luyện Gõ",
                             font=ctk.CTkFont(*Theme.HEADING),
                             text_color=Theme.TEXT)
        title.pack(pady=4)

        elapsed = int(time.time() - self.start_time)
        mins = elapsed // 60
        secs = elapsed % 60

        accuracy = 100
        total_tries = self.correct_count + self.wrong_count
        if total_tries > 0:
            accuracy = int((self.correct_count / total_tries) * 100)

        desc_text = (
            f"Tổng số từ: {len(self.sequence)}\n"
            f"Thời gian hoàn thành: {mins:02d}:{secs:02d}\n"
            f"Độ chính xác khi gõ: {accuracy}%\n\n"
            "Tuyệt vời! Kỹ năng gõ Romaji từ vựng tiếng Nhật của bạn đã tiến bộ."
        )
        desc = ctk.CTkLabel(inner, text=desc_text, font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED, justify="center")
        desc.pack(pady=12)

        btn_finish = ctk.CTkButton(inner, text="Quay lại Kho từ vựng",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                   text_color="white", corner_radius=12, height=44, width=220,
                                   command=self._handle_back)
        btn_finish.pack(pady=10)
