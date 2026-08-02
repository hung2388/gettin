"""
Level 2 Screen - Active Recall.
Shows Vietnamese meaning; user must type Kanji, Hiragana, or Katakana.
"""
import random
import customtkinter as ctk
from typing import Callable, List, Optional


from data.word_data import WordEntry, VocabPack
from view.theme import Theme
from view.screens.vocab_study_hub_screen import speak_japanese_async


class Level2Screen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.pack: Optional[VocabPack] = None
        
        # State
        self.words_pool: List[WordEntry] = []
        self.current_round_words: List[WordEntry] = []
        self.failed_words: List[WordEntry] = []
        self.current_index: int = 0
        self.total_mistakes: int = 0
        self.total_correct: int = 0
        self.original_count: int = 0
        self.evaluated: bool = False
        
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

        self.lbl_title = ctk.CTkLabel(header, text="Level 2: Ghi nhớ (Recall)",
                                      font=ctk.CTkFont(*Theme.HEADING), text_color=Theme.TEXT)
        self.lbl_title.pack(side="right", padx=10)

        # Main Workspace Container
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True, padx=40, pady=10)

        self._build_game_layout()

    def set_pack(self, pack_id: str, selected_words: Optional[List[WordEntry]] = None):
        self.pack = self.model.get_vocab_pack(pack_id)
        if not self.pack or not self.pack.words:
            self._handle_back()
            return

        if selected_words:
            self.words_pool = list(selected_words)
        else:
            self.words_pool = list(self.pack.words)

        self.original_count = len(self.words_pool)
        self.total_mistakes = 0
        self.total_correct = 0
        
        self.current_round_words = list(self.words_pool)
        random.shuffle(self.current_round_words)
        self.failed_words = []
        self.current_index = 0

        self.lbl_title.configure(text=f"{self.pack.name} · Level 2 ({len(self.words_pool)} từ)")
        self._show_current_word()

    def set_on_back(self, cb: Callable):
        self.on_back = cb

    def _handle_back(self):
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

        # Main Question Card
        self.card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=16,
                                 border_width=1, border_color=Theme.BORDER)
        self.card.pack(fill="both", expand=True, padx=20, pady=10)

        card_inner = ctk.CTkFrame(self.card, fg_color="transparent")
        card_inner.pack(expand=True, padx=40, pady=20)

        ctk.CTkLabel(card_inner, text="Nghĩa tiếng Việt:",
                     font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT_MUTED).pack()

        self.lbl_meaning = ctk.CTkLabel(card_inner, text="Con mèo",
                                        font=ctk.CTkFont("Yu Gothic UI", 36, "bold"), text_color=Theme.HIGHLIGHT)
        self.lbl_meaning.pack(pady=15)

        # Input box
        self.input_container = ctk.CTkFrame(card_inner, fg_color=Theme.SURFACE,
                                            corner_radius=12, border_width=2,
                                            border_color=Theme.ACCENT)
        self.input_container.pack(pady=10)

        self.input_var = ctk.StringVar()
        self.input_field = ctk.CTkEntry(self.input_container, textvariable=self.input_var,
                                        font=ctk.CTkFont("Yu Gothic UI", 18),
                                        text_color=Theme.TEXT,
                                        fg_color=Theme.BG_GRADIENT,
                                        border_color=Theme.ACCENT,
                                        border_width=0,
                                        justify="center",
                                        width=280, height=44)
        self.input_field.pack(padx=4, pady=4)
        self.input_field.bind("<Return>", lambda _: self._submit_answer())

        # Feedback/Help Label
        self.lbl_feedback = ctk.CTkLabel(card_inner, text="Nhập Kanji, Hiragana hoặc Katakana",
                                         font=ctk.CTkFont(*Theme.SMALL), text_color=Theme.TEXT_MUTED)
        self.lbl_feedback.pack(pady=5)

        # Buttons Row
        self.btn_row = ctk.CTkFrame(card_inner, fg_color="transparent")
        self.btn_row.pack(pady=10)

        self.btn_submit = ctk.CTkButton(self.btn_row, text="Kiểm tra ⛩",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                        text_color="white", corner_radius=10, width=120, height=36,
                                        command=self._submit_answer)
        self.btn_submit.pack(side="left", padx=5)

        self.btn_next = ctk.CTkButton(self.btn_row, text="Tiếp theo →",
                                      font=ctk.CTkFont(*Theme.BODY_BOLD),
                                      fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                      text_color="white", corner_radius=10, width=120, height=36,
                                      command=self._next_question)
        self.btn_next.pack_forget()

    def _show_current_word(self):
        if self.current_index >= len(self.current_round_words):
            if self.failed_words:
                self.current_round_words = list(self.failed_words)
                random.shuffle(self.current_round_words)
                self.failed_words = []
                self.current_index = 0
            else:
                self._finish_game()
                return

        word = self.current_round_words[self.current_index]
        self.lbl_meaning.configure(text=word.meaning)
        
        self.input_var.set("")
        self.evaluated = False
        
        self.card.configure(border_color=Theme.BORDER, border_width=1)
        self.lbl_feedback.configure(text="Nhập Kanji, Hiragana hoặc Katakana", text_color=Theme.TEXT_MUTED)
        
        self.btn_submit.pack(side="left")
        self.btn_next.pack_forget()
        
        self.lbl_status.configure(text=f"Từ vựng: {self.current_index + 1} / {len(self.current_round_words)} (Còn lại: {self.original_count - self.total_correct} từ)")
        self.lbl_score.configure(text=f"Đúng: {self.total_correct}  |  Sai: {self.total_mistakes}")

        self.input_field.focus_set()

    def _submit_answer(self):
        if self.evaluated:
            return
        
        typed = self.input_var.get().strip().lower()
        if not typed:
            return
            
        self.evaluated = True
        word = self.current_round_words[self.current_index]
        
        correct_word = word.word.lower().strip()
        correct_kana = word.get_kana().lower().strip()
        correct_romaji = word.romaji.lower().strip()

        # Match Kanji, Kana, or Romaji
        is_correct = (typed == correct_word or typed == correct_kana or typed == correct_romaji)

        speak_japanese_async(word.word)

        if is_correct:
            self.total_correct += 1
            self.card.configure(border_color=Theme.SUCCESS, border_width=2)
            self.lbl_feedback.configure(text=f"✓ Chính xác! ({word.word} / {word.get_kana()})", text_color=Theme.SUCCESS)
            
            # Auto-advance
            self.after(1500, self._auto_advance)
        else:
            self.total_mistakes += 1
            self.failed_words.append(word)
            self.card.configure(border_color=Theme.ERROR, border_width=2)
            
            error_msg = f"✗ Sai rồi! Đáp án: {word.word}"
            if word.kana and word.kana != word.word:
                error_msg += f" [{word.kana}]"
            error_msg += f" ({word.romaji})"
            
            self.lbl_feedback.configure(text=error_msg, text_color=Theme.ERROR)

        self.btn_submit.pack_forget()
        self.btn_next.pack(side="left")

    def _auto_advance(self):
        if self.evaluated and self.btn_next.winfo_ismapped():
            self._next_question()

    def _next_question(self):
        self.current_index += 1
        self._show_current_word()

    def _finish_game(self):
        for w in self.main_container.winfo_children():
            w.destroy()

        summary_card = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=16,
                                     border_width=1, border_color=Theme.BORDER)
        summary_card.pack(expand=True, fill="both", padx=40, pady=20)

        inner = ctk.CTkFrame(summary_card, fg_color="transparent")
        inner.pack(expand=True)

        badge = ctk.CTkFrame(inner, fg_color=Theme.GOLD, corner_radius=12)
        badge.pack(pady=(0, 16))
        ctk.CTkLabel(badge, text="🏆 HOÀN THÀNH LEVEL 2",
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
            f"Lần gõ đúng đầu tiên: {self.total_correct}\n"
            f"Số lỗi sai mắc phải: {self.total_mistakes}\n"
            f"Độ chính xác: {accuracy}%\n\n"
            "Bạn đã ghi nhớ thành công các từ vựng này!"
        )
        desc = ctk.CTkLabel(inner, text=desc_text, font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED, justify="center")
        desc.pack(pady=12)

        btn_finish = ctk.CTkButton(inner, text="Quay lại Kho từ vựng",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                   text_color="white", corner_radius=12, height=44, width=220,
                                   command=self._handle_back)
        btn_finish.pack(pady=10)
