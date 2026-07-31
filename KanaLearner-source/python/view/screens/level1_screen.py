"""
Level 1 Screen - Multiple Choice (Dual Panel: Kana + Meaning).
Includes audio TTS playback upon completion and a wrong-answer review loop.
"""
import random
import time
import customtkinter as ctk
from typing import Callable, List, Optional

from data.word_data import WordEntry, VocabPack
from view.theme import Theme
from view.screens.vocab_study_hub_screen import speak_japanese_async


class Level1Screen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.pack: Optional[VocabPack] = None
        self.words_pool: List[WordEntry] = []
        
        # Game State
        self.current_round_words: List[WordEntry] = []
        self.failed_words: List[WordEntry] = []
        self.current_index: int = 0
        self.total_mistakes: int = 0
        self.total_correct: int = 0
        self.original_count: int = 0

        # Current Word State
        self.selected_kana: Optional[str] = None
        self.selected_meaning: Optional[str] = None
        self.evaluated: bool = False
        self.auto_timer: Optional[str] = None
        
        self.on_back: Optional[Callable] = None
        
        # ── UI Elements ──
        # Top Accent
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.TEAL, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # Header Row
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(15, 5))

        self.btn_back = ctk.CTkButton(header, text="← Quay lại",
                                      font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                      fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                      text_color=Theme.TEXT, corner_radius=8, height=32, width=100,
                                      command=self._handle_back)
        self.btn_back.pack(side="left")

        self.lbl_title = ctk.CTkLabel(header, text="Level 1: Học từ mới & Trắc nghiệm",
                                      font=ctk.CTkFont(*Theme.HEADING), text_color=Theme.TEXT)
        self.lbl_title.pack(side="right", padx=10)

        # Main Workspace Container
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True, padx=40, pady=10)

        self._build_game_layout()

    def set_pack(self, pack_id: str):
        self.pack = self.model.get_vocab_pack(pack_id)
        if not self.pack or not self.pack.words:
            self._handle_back()
            return

        self.words_pool = list(self.pack.words)
        self.original_count = len(self.words_pool)
        self.total_mistakes = 0
        self.total_correct = 0
        
        # Initialize review loop
        self.current_round_words = list(self.words_pool)
        random.shuffle(self.current_round_words)
        self.failed_words = []
        self.current_index = 0

        self.lbl_title.configure(text=f"{self.pack.name} · Level 1")
        self._show_current_word()

    def set_on_back(self, cb: Callable):
        self.on_back = cb

    def _handle_back(self):
        if self.auto_timer:
            try:
                self.after_cancel(self.auto_timer)
            except Exception:
                pass
            self.auto_timer = None
        if self.on_back:
            self.on_back()

    def _build_game_layout(self):
        # Progress & Status Row
        self.progress_row = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.progress_row.pack(fill="x", pady=(0, 10))

        self.lbl_status = ctk.CTkLabel(self.progress_row, text="Tiến trình: 0 / 0 từ",
                                       font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT_MUTED)
        self.lbl_status.pack(side="left")

        self.lbl_score = ctk.CTkLabel(self.progress_row, text="Đúng: 0  |  Sai: 0",
                                      font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT_MUTED)
        self.lbl_score.pack(side="right")

        # Large Word display Card
        self.word_card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=16,
                                      border_width=1, border_color=Theme.BORDER)
        self.word_card.pack(fill="x", pady=10)

        self.lbl_word = ctk.CTkLabel(self.word_card, text="猫",
                                     font=ctk.CTkFont("Yu Gothic UI", 48, "bold"), text_color=Theme.HIGHLIGHT)
        self.lbl_word.pack(pady=20)

        # Dual Panel for choices
        self.choices_panel = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.choices_panel.pack(fill="both", expand=True, pady=10)

        # Left Column: Kana choices
        self.left_col = ctk.CTkFrame(self.choices_panel, fg_color=Theme.BG_GRADIENT, corner_radius=12,
                                     border_width=1, border_color=Theme.BORDER)
        self.left_col.pack(side="left", fill="both", expand=True, padx=(0, 10))

        ctk.CTkLabel(self.left_col, text="Chọn cách đọc Hiragana đúng:",
                     font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT_MUTED).pack(pady=8)
        self.kana_buttons_frame = ctk.CTkFrame(self.left_col, fg_color="transparent")
        self.kana_buttons_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Right Column: Meaning choices
        self.right_col = ctk.CTkFrame(self.choices_panel, fg_color=Theme.BG_GRADIENT, corner_radius=12,
                                      border_width=1, border_color=Theme.BORDER)
        self.right_col.pack(side="left", fill="both", expand=True, padx=(10, 0))

        ctk.CTkLabel(self.right_col, text="Chọn nghĩa tiếng Việt đúng:",
                     font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT_MUTED).pack(pady=8)
        self.meaning_buttons_frame = ctk.CTkFrame(self.right_col, fg_color="transparent")
        self.meaning_buttons_frame.pack(fill="both", expand=True, padx=20, pady=10)

    def _show_current_word(self):
        if self.auto_timer:
            try:
                self.after_cancel(self.auto_timer)
            except Exception:
                pass
            self.auto_timer = None

        if self.current_index >= len(self.current_round_words):
            # End of round logic
            if self.failed_words:
                self.current_round_words = list(self.failed_words)
                random.shuffle(self.current_round_words)
                self.failed_words = []
                self.current_index = 0
            else:
                self._finish_game()
                return

        word = self.current_round_words[self.current_index]
        self.lbl_word.configure(text=word.word)
        
        # Reset selections
        self.selected_kana = None
        self.selected_meaning = None
        self.evaluated = False

        # Update stats labels
        self.lbl_status.configure(text=f"Từ vựng: {self.current_index + 1} / {len(self.current_round_words)} (Còn lại: {self.original_count - self.total_correct} từ)")
        self.lbl_score.configure(text=f"Đúng: {self.total_correct}  |  Sai: {self.total_mistakes}")

        # Generate choice pools
        kana_pool = [w.get_kana() for w in self.words_pool]
        meaning_pool = [w.meaning for w in self.words_pool]

        kana_choices = self._generate_choices(word.get_kana(), kana_pool, is_meaning=False)
        meaning_choices = self._generate_choices(word.meaning, meaning_pool, is_meaning=True)

        self._build_choice_buttons(kana_choices, meaning_choices)

    def _generate_choices(self, correct: str, pool: List[str], is_meaning: bool) -> List[str]:
        choices = {correct}
        other_pool = [x for x in pool if x != correct]
        random.shuffle(other_pool)
        for x in other_pool:
            if len(choices) >= 4:
                break
            choices.add(x)
        # Pad if less than 4 choices
        fallbacks = (
            ["Con mèo", "Con chó", "Thời gian", "Màu sắc", "Gia đình", "Ô tô", "Xe đạp", "Bữa cơm"]
            if is_meaning else
            ["ねこ", "いぬ", "いま", "あか", "かぞく", "くるま", "じてんしゃ", "ごはん"]
        )
        for f in fallbacks:
            if len(choices) >= 4:
                break
            if f != correct:
                choices.add(f)
        choices_list = list(choices)
        random.shuffle(choices_list)
        return choices_list

    def _build_choice_buttons(self, kana_choices: List[str], meaning_choices: List[str]):
        # Clear old buttons
        for w in self.kana_buttons_frame.winfo_children(): w.destroy()
        for w in self.meaning_buttons_frame.winfo_children(): w.destroy()

        self.kana_buttons = []
        self.meaning_buttons = []

        # Build Kana buttons
        for c in kana_choices:
            btn = ctk.CTkButton(self.kana_buttons_frame, text=c,
                                font=ctk.CTkFont("Yu Gothic UI", 16, "bold"),
                                fg_color=Theme.CARD, hover_color=Theme.CARD_HOVER,
                                text_color=Theme.TEXT, height=44, corner_radius=8,
                                command=lambda val=c: self._select_kana(val))
            btn.pack(fill="x", pady=5)
            self.kana_buttons.append((btn, c))

        # Build Meaning buttons
        for c in meaning_choices:
            btn = ctk.CTkButton(self.meaning_buttons_frame, text=c,
                                font=ctk.CTkFont(*Theme.BODY),
                                fg_color=Theme.CARD, hover_color=Theme.CARD_HOVER,
                                text_color=Theme.TEXT, height=44, corner_radius=8,
                                command=lambda val=c: self._select_meaning(val))
            btn.pack(fill="x", pady=5)
            self.meaning_buttons.append((btn, c))

    def _select_kana(self, value: str):
        if self.evaluated: return
        self.selected_kana = value
        
        # Highlight selected
        for btn, val in self.kana_buttons:
            if val == value:
                btn.configure(fg_color=Theme.SURFACE, text_color="white")
            else:
                btn.configure(fg_color=Theme.CARD, text_color=Theme.TEXT)

        self._check_and_evaluate()

    def _select_meaning(self, value: str):
        if self.evaluated: return
        self.selected_meaning = value
        
        # Highlight selected
        for btn, val in self.meaning_buttons:
            if val == value:
                btn.configure(fg_color=Theme.SURFACE, text_color="white")
            else:
                btn.configure(fg_color=Theme.CARD, text_color=Theme.TEXT)

        self._check_and_evaluate()

    def _check_and_evaluate(self):
        if self.selected_kana and self.selected_meaning and not self.evaluated:
            self.evaluated = True
            word = self.current_round_words[self.current_index]

            correct_kana = word.get_kana()
            correct_meaning = word.meaning

            is_kana_correct = (self.selected_kana == correct_kana)
            is_meaning_correct = (self.selected_meaning == correct_meaning)

            # Highlight results
            for btn, val in self.kana_buttons:
                if val == correct_kana:
                    btn.configure(fg_color=Theme.SUCCESS_DARK, text_color="white")
                elif val == self.selected_kana and not is_kana_correct:
                    btn.configure(fg_color=Theme.ERROR_DARK, text_color="white")

            for btn, val in self.meaning_buttons:
                if val == correct_meaning:
                    btn.configure(fg_color=Theme.SUCCESS_DARK, text_color="white")
                elif val == self.selected_meaning and not is_meaning_correct:
                    btn.configure(fg_color=Theme.ERROR_DARK, text_color="white")

            # TTS pronunciation
            speak_japanese_async(word.word)

            if is_kana_correct and is_meaning_correct:
                self.total_correct += 1
            else:
                self.total_mistakes += 1
                self.failed_words.append(word)

            # Auto advance after 800ms
            self.auto_timer = self.after(800, self._auto_advance)

    def _auto_advance(self):
        self.auto_timer = None
        if self.evaluated:
            self._next_question()

    def _next_question(self):
        self.current_index += 1
        self._show_current_word()

    def _finish_game(self):
        # Update progress in model to 100%
        if self.pack:
            self.model.progress[self.pack.id] = 100.0
            self.model.save_progress()

        # Clear UI and show summary card
        for w in self.main_container.winfo_children():
            w.destroy()

        summary_card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=16,
                                     border_width=1, border_color=Theme.BORDER)
        summary_card.pack(expand=True, fill="both", padx=40, pady=20)

        inner = ctk.CTkFrame(summary_card, fg_color="transparent")
        inner.pack(expand=True)

        badge = ctk.CTkFrame(inner, fg_color=Theme.GOLD, corner_radius=12)
        badge.pack(pady=(0, 16))
        ctk.CTkLabel(badge, text="🏆 HOÀN THÀNH LEVEL 1",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color="black").pack(padx=16, pady=4)

        title = ctk.CTkLabel(inner, text="Kết Quả Học Tập",
                             font=ctk.CTkFont(*Theme.HEADING),
                             text_color=Theme.TEXT)
        title.pack(pady=4)

        accuracy = 100
        total_tries = self.total_correct + self.total_mistakes
        if total_tries > 0:
            accuracy = int((self.total_correct / total_tries) * 100)

        desc_text = (
            f"Tổng số từ: {self.original_count}\n"
            f"Lần đoán đúng đầu tiên: {self.total_correct}\n"
            f"Số lỗi sai mắc phải: {self.total_mistakes}\n"
            f"Độ chính xác: {accuracy}%\n\n"
            "Tuyệt vời! Bạn đã hoàn thành 100% các từ vựng này."
        )
        desc = ctk.CTkLabel(inner, text=desc_text, font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED, justify="center")
        desc.pack(pady=12)

        btn_finish = ctk.CTkButton(inner, text="Quay lại Kho từ vựng",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                   text_color="white", corner_radius=12, height=44, width=220,
                                   command=self._handle_back)
        btn_finish.pack(pady=10)

