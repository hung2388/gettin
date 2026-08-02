"""
Level 4 Screen - Word Matching.
Displays grid of Kanji, Kana, and Vietnamese meaning buttons.
Users select triplets to clear the board.
"""
import random
import customtkinter as ctk
from typing import Callable, List, Optional, Dict, Tuple


from data.word_data import WordEntry, VocabPack
from view.theme import Theme
from view.screens.vocab_study_hub_screen import speak_japanese_async

BATCH_SIZE = 6


class Level4Screen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.pack: Optional[VocabPack] = None
        
        # State
        self.words_pool: List[WordEntry] = []
        self.remaining_pool: List[WordEntry] = []
        self.current_batch: List[WordEntry] = []
        
        # Match Selection State
        self.selected_kanji: Optional[Tuple[ctk.CTkButton, WordEntry]] = None
        self.selected_kana: Optional[Tuple[ctk.CTkButton, WordEntry]] = None
        self.selected_meaning: Optional[Tuple[ctk.CTkButton, WordEntry]] = None
        
        self.matched_words: List[WordEntry] = []
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

        self.lbl_title = ctk.CTkLabel(header, text="Level 4: Ghép thẻ (Match)",
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
        self.remaining_pool = list(self.words_pool)
        random.shuffle(self.remaining_pool)
        self.matched_words = []

        self.lbl_title.configure(text=f"{self.pack.name} · Level 4 ({len(self.words_pool)} từ)")
        self._load_next_batch()

    def set_on_back(self, cb: Callable):
        self.on_back = cb

    def _handle_back(self):
        if self.on_back:
            self.on_back()

    def _build_game_layout(self):
        # Stats info row
        self.progress_row = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.progress_row.pack(fill="x", pady=(0, 10))

        self.lbl_status = ctk.CTkLabel(self.progress_row, text="Tiến trình: 0 / 0 ghép đôi",
                                       font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT_MUTED)
        self.lbl_status.pack(side="left")

        # Triplet Matching Grid panel
        self.grid_panel = ctk.CTkFrame(self.main_container, fg_color=Theme.BG_GRADIENT, corner_radius=16,
                                       border_width=1, border_color=Theme.BORDER)
        self.grid_panel.pack(fill="both", expand=True, pady=10, padx=10)

        # Three column headers
        headers_frame = ctk.CTkFrame(self.grid_panel, fg_color="transparent")
        headers_frame.pack(fill="x", pady=(15, 5))

        cols = [("KANJI / CHỮ", Theme.HIGHLIGHT), ("KANA", Theme.TEAL), ("Ý NGHĨA", Theme.ACCENT_LIGHT)]
        for text, color in cols:
            lbl = ctk.CTkLabel(headers_frame, text=text, font=ctk.CTkFont("Yu Gothic UI", 13, "bold"),
                               text_color=color, width=200)
            lbl.pack(side="left", fill="x", expand=True, padx=10)

        # Three column scroll-free containers
        self.columns_container = ctk.CTkFrame(self.grid_panel, fg_color="transparent")
        self.columns_container.pack(fill="both", expand=True, padx=20, pady=(0, 20))

        self.col_kanji_frame = ctk.CTkFrame(self.columns_container, fg_color="transparent")
        self.col_kanji_frame.pack(side="left", fill="both", expand=True, padx=10)

        self.col_kana_frame = ctk.CTkFrame(self.columns_container, fg_color="transparent")
        self.col_kana_frame.pack(side="left", fill="both", expand=True, padx=10)

        self.col_meaning_frame = ctk.CTkFrame(self.columns_container, fg_color="transparent")
        self.col_meaning_frame.pack(side="left", fill="both", expand=True, padx=10)

    def _load_next_batch(self):
        self._reset_selections()

        if not self.remaining_pool:
            self._finish_game()
            return

        batch_count = min(BATCH_SIZE, len(self.remaining_pool))
        self.current_batch = [self.remaining_pool.pop() for _ in range(batch_count)]

        # Update stats
        self.lbl_status.configure(text=f"Đã ghép: {len(self.matched_words)} / {len(self.words_pool)} từ")

        self._build_batch_buttons()

    def _build_batch_buttons(self):
        # Clear columns
        for w in self.col_kanji_frame.winfo_children(): w.destroy()
        for w in self.col_kana_frame.winfo_children(): w.destroy()
        for w in self.col_meaning_frame.winfo_children(): w.destroy()

        # Shuffle each column individually so they don't line up
        kanji_shuffled = list(self.current_batch)
        random.shuffle(kanji_shuffled)

        kana_shuffled = list(self.current_batch)
        random.shuffle(kana_shuffled)

        meaning_shuffled = list(self.current_batch)
        random.shuffle(meaning_shuffled)

        # Kanji column buttons
        for w_obj in kanji_shuffled:
            btn = ctk.CTkButton(self.col_kanji_frame, text=w_obj.word,
                                font=ctk.CTkFont("Yu Gothic UI", 16, "bold"),
                                fg_color=Theme.CARD, hover_color=Theme.CARD_HOVER,
                                text_color=Theme.TEXT, height=44, corner_radius=8,
                                border_width=1, border_color=Theme.BORDER)
            btn.pack(fill="x", pady=6)
            btn.configure(command=lambda b=btn, w=w_obj: self._select_card(b, w, "kanji"))

        # Kana column buttons
        for w_obj in kana_shuffled:
            btn = ctk.CTkButton(self.col_kana_frame, text=w_obj.get_kana(),
                                font=ctk.CTkFont("Yu Gothic UI", 16, "bold"),
                                fg_color=Theme.CARD, hover_color=Theme.CARD_HOVER,
                                text_color=Theme.TEXT, height=44, corner_radius=8,
                                border_width=1, border_color=Theme.BORDER)
            btn.pack(fill="x", pady=6)
            btn.configure(command=lambda b=btn, w=w_obj: self._select_card(b, w, "kana"))

        # Meaning column buttons
        for w_obj in meaning_shuffled:
            btn = ctk.CTkButton(self.col_meaning_frame, text=w_obj.meaning,
                                font=ctk.CTkFont(*Theme.BODY),
                                fg_color=Theme.CARD, hover_color=Theme.CARD_HOVER,
                                text_color=Theme.TEXT, height=44, corner_radius=8,
                                border_width=1, border_color=Theme.BORDER)
            btn.pack(fill="x", pady=6)
            btn.configure(command=lambda b=btn, w=w_obj: self._select_card(b, w, "meaning"))

    def _select_card(self, button: ctk.CTkButton, word: WordEntry, card_type: str):
        # Prevent clicks on already disabled or error flashing buttons
        if button.cget("state") == "disabled":
            return

        if card_type == "kanji":
            if self.selected_kanji:
                self.selected_kanji[0].configure(fg_color=Theme.CARD, border_color=Theme.BORDER)
            self.selected_kanji = (button, word)
            button.configure(fg_color=Theme.SURFACE, border_color=Theme.HIGHLIGHT)
        elif card_type == "kana":
            if self.selected_kana:
                self.selected_kana[0].configure(fg_color=Theme.CARD, border_color=Theme.BORDER)
            self.selected_kana = (button, word)
            button.configure(fg_color=Theme.SURFACE, border_color=Theme.TEAL)
        else: # meaning
            if self.selected_meaning:
                self.selected_meaning[0].configure(fg_color=Theme.CARD, border_color=Theme.BORDER)
            self.selected_meaning = (button, word)
            button.configure(fg_color=Theme.SURFACE, border_color=Theme.ACCENT_LIGHT)

        # Check match
        self._check_triplet_match()

    def _check_triplet_match(self):
        if self.selected_kanji and self.selected_kana and self.selected_meaning:
            btn_k, word_k = self.selected_kanji
            btn_a, word_a = self.selected_kana
            btn_m, word_m = self.selected_meaning

            # If all three represent the exact same word entry object
            if word_k == word_a == word_m:
                # Correct match!
                speak_japanese_async(word_k.word)
                
                # Make them disappear
                btn_k.pack_forget()
                btn_a.pack_forget()
                btn_m.pack_forget()

                self.matched_words.append(word_k)
                self.lbl_status.configure(text=f"Đã ghép: {len(self.matched_words)} / {len(self.words_pool)} từ")

                # Remove from batch
                self.current_batch = [w for w in self.current_batch if w != word_k]
                self._reset_selections()

                # If batch is empty, load next batch
                if not self.current_batch:
                    self._load_next_batch()
            else:
                # Incorrect match! Flash red
                btn_k.configure(fg_color=Theme.ERROR_DARK, border_color=Theme.ERROR)
                btn_a.configure(fg_color=Theme.ERROR_DARK, border_color=Theme.ERROR)
                btn_m.configure(fg_color=Theme.ERROR_DARK, border_color=Theme.ERROR)

                # Store current buttons to reset in background
                temp_k, temp_a, temp_m = btn_k, btn_a, btn_m
                self._reset_selections()

                # Reset after a short delay
                self.after(800, lambda: self._reset_card_styles(temp_k, temp_a, temp_m))

    def _reset_card_styles(self, btn_k, btn_a, btn_m):
        try:
            if btn_k.winfo_exists(): btn_k.configure(fg_color=Theme.CARD, border_color=Theme.BORDER)
            if btn_a.winfo_exists(): btn_a.configure(fg_color=Theme.CARD, border_color=Theme.BORDER)
            if btn_m.winfo_exists(): btn_m.configure(fg_color=Theme.CARD, border_color=Theme.BORDER)
        except Exception:
            pass

    def _reset_selections(self):
        self.selected_kanji = None
        self.selected_kana = None
        self.selected_meaning = None

    def _finish_game(self):
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
        ctk.CTkLabel(badge, text="🏆 HOÀN THÀNH LEVEL 4",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color="black").pack(padx=16, pady=4)

        title = ctk.CTkLabel(inner, text="Ghép Thẻ Thành Công!",
                             font=ctk.CTkFont(*Theme.HEADING),
                             text_color=Theme.TEXT)
        title.pack(pady=4)

        desc_text = (
            f"Bạn đã ghép chính xác {len(self.words_pool)} / {len(self.words_pool)} từ vựng.\n"
            "Chúc mừng bạn đã kết nối thành công mặt chữ Kanji, cách đọc Kana và nghĩa tiếng Việt."
        )
        desc = ctk.CTkLabel(inner, text=desc_text, font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED, justify="center")
        desc.pack(pady=12)

        btn_finish = ctk.CTkButton(inner, text="Quay lại Kho từ vựng",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                   text_color="white", corner_radius=12, height=44, width=220,
                                   command=self._handle_back)
        btn_finish.pack(pady=10)
