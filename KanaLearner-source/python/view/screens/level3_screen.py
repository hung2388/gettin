"""
Level 3 Screen - Listening Test.
Plays blocks of words via TTS; user has a countdown timer to fill in answers.
Features individual word replay buttons for an improved user experience.
"""
import random
import time
import threading
import customtkinter as ctk
from typing import Callable, List, Optional


from data.word_data import WordEntry, VocabPack
from view.theme import Theme
from view.screens.vocab_study_hub_screen import speak_japanese_async


# Configurable Parameters
WORDS_PER_BLOCK = 10
COUNTDOWN_SECONDS = 20
SPEAK_DELAY_MS = 2500  # Pause between words during sequence play


class Level3Screen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.pack: Optional[VocabPack] = None
        
        # State
        self.words_pool: List[WordEntry] = []
        self.blocks: List[List[WordEntry]] = []
        self.current_block_index: int = 0
        self.current_block_words: List[WordEntry] = []
        
        # Grading stats
        self.total_correct: int = 0
        self.total_words_tested: int = 0
        
        # Playing state
        self.is_playing_sequence: bool = False
        self.countdown_left: int = 0
        self.timer_after_id: Optional[str] = None
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

        self.lbl_title = ctk.CTkLabel(header, text="Level 3: Luyện nghe viết",
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
        random.shuffle(self.words_pool)
        
        # Divide words into blocks
        self.blocks = []
        for i in range(0, len(self.words_pool), WORDS_PER_BLOCK):
            self.blocks.append(self.words_pool[i:i + WORDS_PER_BLOCK])

        self.current_block_index = 0
        self.total_correct = 0
        self.total_words_tested = 0

        self.lbl_title.configure(text=f"{self.pack.name} · Level 3 ({len(self.words_pool)} từ)")
        self._load_block()

    def set_on_back(self, cb: Callable):
        self.on_back = cb

    def _handle_back(self):
        self._stop_timer()
        self.is_playing_sequence = False
        if self.on_back:
            self.on_back()

    def _build_game_layout(self):
        # Top panel with Info & Sequence controls
        self.top_control = ctk.CTkFrame(self.main_container, fg_color=Theme.CARD, corner_radius=12,
                                        border_width=1, border_color=Theme.BORDER)
        self.top_control.pack(fill="x", pady=(0, 10))

        # Status & Block Info
        info_sub = ctk.CTkFrame(self.top_control, fg_color="transparent")
        info_sub.pack(fill="x", padx=20, pady=(10, 5))
        
        self.lbl_block_num = ctk.CTkLabel(info_sub, text="Nhóm: 1 / 1",
                                          font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT)
        self.lbl_block_num.pack(side="left")

        self.lbl_timer = ctk.CTkLabel(info_sub, text="⏱ 00s",
                                      font=ctk.CTkFont(*Theme.HEADING), text_color=Theme.WARNING)
        self.lbl_timer.pack(side="right")

        # Play Sequence button
        play_sub = ctk.CTkFrame(self.top_control, fg_color="transparent")
        play_sub.pack(fill="x", padx=20, pady=(5, 10))

        self.btn_play_seq = ctk.CTkButton(play_sub, text="🔊 Phát loa chuỗi từ",
                                          font=ctk.CTkFont(*Theme.BODY_BOLD),
                                          fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                          text_color="white", corner_radius=10, width=200, height=36,
                                          command=self._play_block_sequence)
        self.btn_play_seq.pack(side="left")

        self.lbl_play_status = ctk.CTkLabel(play_sub, text="Nhấn để nghe chuỗi từ",
                                            font=ctk.CTkFont(*Theme.SMALL), text_color=Theme.TEXT_MUTED)
        self.lbl_play_status.pack(side="left", padx=15)

        # Scrollable area for 10 inputs
        self.scroll_inputs = ctk.CTkScrollableFrame(self.main_container, fg_color=Theme.BG_GRADIENT,
                                                    corner_radius=14, border_width=1, border_color=Theme.BORDER)
        self.scroll_inputs.pack(fill="both", expand=True, pady=10)

        # Action panel (Submit / Next)
        self.action_panel = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.action_panel.pack(fill="x", pady=10)

        self.btn_submit = ctk.CTkButton(self.action_panel, text="Nộp bài ⛩",
                                        font=ctk.CTkFont(*Theme.BODY_BOLD),
                                        fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                        text_color="white", corner_radius=10, width=155, height=38,
                                        command=self._evaluate_answers)
        self.btn_submit.pack(side="right")

        self.btn_next = ctk.CTkButton(self.action_panel, text="Nhóm tiếp theo →",
                                      font=ctk.CTkFont(*Theme.BODY_BOLD),
                                      fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                      text_color="white", corner_radius=10, width=155, height=38,
                                      command=self._next_block)
        self.btn_next.pack_forget()

        self.lbl_block_result = ctk.CTkLabel(self.action_panel, text="",
                                             font=ctk.CTkFont(*Theme.BODY_BOLD),
                                             text_color=Theme.HIGHLIGHT)

    def _load_block(self):
        self._stop_timer()
        self.is_playing_sequence = False
        self.evaluated = False
        
        self.btn_play_seq.configure(state="normal", fg_color=Theme.TEAL)
        self.lbl_play_status.configure(text="Sẵn sàng phát chuỗi từ", text_color=Theme.TEXT_MUTED)
        self.lbl_timer.configure(text="⏱ --s", text_color=Theme.WARNING)
        
        self.btn_submit.pack(side="right")
        self.btn_submit.configure(state="disabled") # Disable until they play sequence
        self.btn_next.pack_forget()
        self.lbl_block_result.pack_forget()

        self.current_block_words = self.blocks[self.current_block_index]
        self.lbl_block_num.configure(text=f"Nhóm từ vựng: {self.current_block_index + 1} / {len(self.blocks)}")

        self._build_input_rows()

    def _build_input_rows(self):
        for w in self.scroll_inputs.winfo_children():
            w.destroy()

        self.input_vars = []
        self.input_fields = []
        self.feedback_lbls = []
        self.row_frames = []

        for i, word in enumerate(self.current_block_words):
            row = ctk.CTkFrame(self.scroll_inputs, fg_color=Theme.CARD, corner_radius=8,
                               border_width=1, border_color=Theme.BORDER)
            row.pack(fill="x", pady=4, padx=5)
            self.row_frames.append(row)

            # Left number label
            ctk.CTkLabel(row, text=f"{i+1}.", font=ctk.CTkFont(*Theme.BODY_BOLD), width=30).pack(side="left", padx=8)

            # Replay button
            btn_replay = ctk.CTkButton(row, text="🔊", font=ctk.CTkFont(*Theme.SMALL),
                                       fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                       text_color="white", width=36, height=30, corner_radius=6,
                                       command=lambda w_obj=word: speak_japanese_async(w_obj.word))
            btn_replay.pack(side="left", padx=5)

            # Input field
            var = ctk.StringVar()
            self.input_vars.append(var)
            
            ent = ctk.CTkEntry(row, textvariable=var, font=ctk.CTkFont(*Theme.BODY),
                               fg_color=Theme.BG_GRADIENT, border_color=Theme.BORDER,
                               width=240, height=36, corner_radius=6)
            ent.pack(side="left", padx=10, pady=8)
            self.input_fields.append(ent)

            # Feedback label (shows correct answer on eval)
            lbl_feed = ctk.CTkLabel(row, text="", font=ctk.CTkFont(*Theme.SMALL_BOLD), text_color=Theme.SUCCESS)
            lbl_feed.pack(side="left", padx=10)
            self.feedback_lbls.append(lbl_feed)

    def _play_block_sequence(self):
        if self.is_playing_sequence:
            return
        
        self.is_playing_sequence = True
        self.btn_play_seq.configure(state="disabled", fg_color=Theme.BORDER)
        
        def _speak_thread():
            for idx, word in enumerate(self.current_block_words):
                if not self.is_playing_sequence:
                    return
                # Update UI on playing index
                self._highlight_input_playing(idx)
                speak_japanese_async(word.word)
                time.sleep(SPEAK_DELAY_MS / 1000.0)

            # Completed speaking, start countdown
            self._highlight_input_playing(-1) # Reset highlight
            self._start_countdown()

        threading.Thread(target=_speak_thread, daemon=True).start()

    def _highlight_input_playing(self, play_idx: int):
        self.lbl_play_status.configure(
            text=f"Đang phát từ số: {play_idx + 1} / {len(self.current_block_words)}..." if play_idx >= 0 else "Đã phát xong chuỗi từ! Bắt đầu gõ đáp án.",
            text_color=Theme.HIGHLIGHT if play_idx >= 0 else Theme.SUCCESS
        )
        for idx, row in enumerate(self.row_frames):
            if idx == play_idx:
                row.configure(border_color=Theme.ACCENT)
            else:
                row.configure(border_color=Theme.BORDER)

    def _start_countdown(self):
        self.countdown_left = COUNTDOWN_SECONDS
        self.btn_submit.configure(state="normal")
        self._tick_timer()

    def _tick_timer(self):
        self.lbl_timer.configure(text=f"⏱ {self.countdown_left:02d}s")
        if self.countdown_left <= 0:
            self._evaluate_answers()
        else:
            self.countdown_left -= 1
            self.timer_after_id = self.after(1000, self._tick_timer)

    def _stop_timer(self):
        if self.timer_after_id:
            self.after_cancel(self.timer_after_id)
            self.timer_after_id = None

    def _evaluate_answers(self):
        if self.evaluated:
            return
        
        self._stop_timer()
        self.evaluated = True
        self.lbl_timer.configure(text="⏱ Hết giờ", text_color=Theme.ERROR)
        self.btn_submit.pack_forget()
        self.btn_next.pack(side="right")
        self.btn_play_seq.configure(state="disabled")

        block_correct = 0

        for idx, word in enumerate(self.current_block_words):
            typed = self.input_vars[idx].get().strip().lower()
            correct_meaning = word.meaning.lower().strip()

            is_correct = (typed == correct_meaning)

            ans_text = f"Đúng: {word.meaning}"
            if word.word:
                ans_text += f" (Từ: {word.word}"
                if word.kana and word.kana != word.word:
                    ans_text += f" [{word.kana}]"
                ans_text += ")"

            if is_correct:
                block_correct += 1
                self.feedback_lbls[idx].configure(text=f"✓ {ans_text}", text_color=Theme.SUCCESS)
                self.row_frames[idx].configure(border_color=Theme.SUCCESS)
            else:
                self.feedback_lbls[idx].configure(text=f"✗ {ans_text}", text_color=Theme.ERROR)
                self.row_frames[idx].configure(border_color=Theme.ERROR)
            
            # Disable input fields
            self.input_fields[idx].configure(state="disabled")

        self.total_correct += block_correct
        self.total_words_tested += len(self.current_block_words)
        
        self.lbl_block_result.configure(text=f"Kết quả nhóm này: Đúng {block_correct} / {len(self.current_block_words)}")
        self.lbl_block_result.pack(side="left", padx=20)

    def _next_block(self):
        self.current_block_index += 1
        if self.current_block_index < len(self.blocks):
            self._load_block()
        else:
            self._finish_game()

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
        ctk.CTkLabel(badge, text="🏆 HOÀN THÀNH LEVEL 3",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color="black").pack(padx=16, pady=4)

        title = ctk.CTkLabel(inner, text="Kết Quả Luyện Nghe",
                             font=ctk.CTkFont(*Theme.HEADING),
                             text_color=Theme.TEXT)
        title.pack(pady=4)

        accuracy = 100
        if self.total_words_tested > 0:
            accuracy = int((self.total_correct / self.total_words_tested) * 100)

        desc_text = (
            f"Tổng số từ đã kiểm tra: {self.total_words_tested}\n"
            f"Số câu nghe viết đúng: {self.total_correct}\n"
            f"Độ chính xác nghe viết: {accuracy}%\n\n"
            "Khả năng nghe nhận diện từ vựng của bạn rất tốt!"
        )
        desc = ctk.CTkLabel(inner, text=desc_text, font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED, justify="center")
        desc.pack(pady=12)

        btn_finish = ctk.CTkButton(inner, text="Quay lại Kho từ vựng",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                   text_color="white", corner_radius=12, height=44, width=220,
                                   command=self._handle_back)
        btn_finish.pack(pady=10)
