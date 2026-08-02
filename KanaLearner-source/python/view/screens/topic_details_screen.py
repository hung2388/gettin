"""
Topic Details Screen – Study Hub containing Vocabulary list (with TTS pronunciation),
interactive Flashcards, and Quiz launcher.
"""
import tkinter as tk
from tkinter import messagebox
import customtkinter as ctk
import subprocess
import threading
from typing import Callable, List, Optional, Set

from data.word_data import WordEntry, get_words_for_type
from view.theme import Theme


def speak_japanese_async(text: str):
    """Speaks Japanese text asynchronously using native Windows TTS to keep UI responsive."""
    # Clean text to avoid PowerShell injection issues
    safe_text = "".join(c for c in text if c.isalnum() or c in " 。、！？.!?")
    
    def _run():
        ps_code = f"""
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {{
    $synth.SelectVoice('Microsoft Haruka Desktop')
}} catch {{}}
$synth.Speak('{safe_text}')
"""
        subprocess.run(["powershell", "-Command", ps_code], capture_output=True)

    threading.Thread(target=_run, daemon=True).start()


class TopicDetailsScreen(ctk.CTkFrame):

    def __init__(self, master):
        super().__init__(master, fg_color=Theme.BG)

        self.topic_name: str = ""
        self.topic_key: str = ""
        self.words: List[WordEntry] = []
        self.selected_indices: Set[int] = set()
        
        # Flashcard state
        self.fc_index: int = 0
        self.fc_flipped: bool = False

        self.on_back: Optional[Callable] = None
        self.on_start_quiz: Optional[Callable] = None
        self.on_start_handwriting: Optional[Callable] = None

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Header ────────────────────────────────────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(20, 10))

        btn_back = ctk.CTkButton(header, text="← Quay lại Bản đồ",
                                 font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, height=32, width=150,
                                 command=self._handle_back)
        btn_back.pack(side="left")

        self.title_label = ctk.CTkLabel(header, text="Topic Name",
                                        font=ctk.CTkFont(*Theme.HEADING),
                                        text_color=Theme.TEXT)
        self.title_label.pack(side="right", padx=10)

        # ── Tab Navigation ────────────────────────────────────────────────
        self.tab_var = ctk.StringVar(value="Từ vựng")
        self.tab_selector = ctk.CTkSegmentedButton(self, values=["Từ vựng", "Flashcards", "Luyện tập (Quiz)"],
                                                   variable=self.tab_var,
                                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                                   selected_color=Theme.ACCENT,
                                                   selected_hover_color=Theme.ACCENT_GLOW,
                                                   unselected_color=Theme.CARD,
                                                   unselected_hover_color=Theme.CARD_HOVER,
                                                   command=self._on_tab_changed)
        self.tab_selector.pack(fill="x", padx=40, pady=10)

        # ── Main Content Container ────────────────────────────────────────
        self.content_container = ctk.CTkFrame(self, fg_color=Theme.BG_GRADIENT,
                                              corner_radius=16, border_width=1, border_color=Theme.BORDER)
        self.content_container.pack(fill="both", expand=True, padx=40, pady=(0, 24))

        # We will dynamically populate this container based on the selected tab
        self.active_frame: Optional[ctk.CTkFrame] = None

    def set_topic(self, topic_key: str, topic_name: str):
        if self.topic_key != topic_key:
            self.topic_key = topic_key
            self.topic_name = topic_name
            self.title_label.configure(text=topic_name)
            
            # Load vocab words
            from model.app_model import KanaType
            try:
                ktype = KanaType(topic_key)
                self.words = get_words_for_type(ktype)
            except Exception:
                self.words = []
            self.selected_indices = set(range(len(self.words)))
        else:
            self.title_label.configure(text=topic_name)
            
        # Reset flashcards
        self.fc_index = 0
        self.fc_flipped = False

        # Refresh active tab
        self._on_tab_changed(self.tab_var.get())

    def get_selected_words(self) -> List[WordEntry]:
        return [w for idx, w in enumerate(self.words) if idx in self.selected_indices]

    def set_callbacks(self, on_back: Callable, on_start_quiz: Callable, on_start_handwriting: Callable):
        self.on_back = on_back
        self.on_start_quiz = on_start_quiz
        self.on_start_handwriting = on_start_handwriting

    def _handle_back(self):
        if self.on_back:
            self.on_back()

    def _on_tab_changed(self, tab_name: str):
        if self.active_frame:
            self.active_frame.destroy()

        self.active_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.active_frame.pack(fill="both", expand=True, padx=20, pady=20)

        if tab_name == "Từ vựng":
            self._build_vocab_tab()
        elif tab_name == "Flashcards":
            self._build_flashcards_tab()
        else:
            self._build_practice_tab()

    # ── Vocab Tab ─────────────────────────────────────────────────────────

    def _build_vocab_tab(self):
        if not self.words:
            lbl = ctk.CTkLabel(self.active_frame, text="Không có từ vựng nào trong chủ đề này.",
                               font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED)
            lbl.pack(expand=True)
            return

        # ── Word selection control bar ────────────────────────────────────
        toolbar = ctk.CTkFrame(self.active_frame, fg_color=Theme.CARD, corner_radius=10,
                               border_width=1, border_color=Theme.BORDER)
        toolbar.pack(fill="x", pady=(0, 10))

        self.lbl_select_count = ctk.CTkLabel(
            toolbar,
            text=f"📌 Đã chọn: {len(self.selected_indices)} / {len(self.words)} từ để học",
            font=ctk.CTkFont(*Theme.BODY_BOLD),
            text_color=Theme.TEAL
        )
        self.lbl_select_count.pack(side="left", padx=15, pady=8)

        btn_select_all = ctk.CTkButton(
            toolbar, text="☑️ Chọn tất cả",
            font=ctk.CTkFont(*Theme.SMALL_BOLD),
            fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
            text_color=Theme.TEXT, width=110, height=30,
            command=self._select_all_words
        )
        btn_select_all.pack(side="right", padx=5, pady=8)

        btn_deselect_all = ctk.CTkButton(
            toolbar, text="🔲 Bỏ chọn tất cả",
            font=ctk.CTkFont(*Theme.SMALL_BOLD),
            fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
            text_color=Theme.TEXT, width=120, height=30,
            command=self._deselect_all_words
        )
        btn_deselect_all.pack(side="right", padx=5, pady=8)

        btn_invert = ctk.CTkButton(
            toolbar, text="🔄 Đảo chọn",
            font=ctk.CTkFont(*Theme.SMALL_BOLD),
            fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
            text_color=Theme.TEXT, width=100, height=30,
            command=self._invert_word_selection
        )
        btn_invert.pack(side="right", padx=5, pady=8)

        scroll = ctk.CTkScrollableFrame(self.active_frame, fg_color="transparent",
                                        scrollbar_button_color=Theme.ACCENT,
                                        scrollbar_button_hover_color=Theme.ACCENT_LIGHT)
        scroll.pack(fill="both", expand=True)

        for idx, entry in enumerate(self.words):
            row = ctk.CTkFrame(scroll, fg_color=Theme.CARD, corner_radius=10,
                               border_width=1, border_color=Theme.BORDER)
            row.pack(fill="x", pady=4, padx=5)

            # Checkbox for selecting word
            chk_var = ctk.BooleanVar(value=(idx in self.selected_indices))
            chk = ctk.CTkCheckBox(
                row, text="", width=24, checkbox_width=22, checkbox_height=22,
                corner_radius=6, fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                variable=chk_var,
                command=lambda i=idx, v=chk_var: self._toggle_word_selection(i, v.get())
            )
            chk.pack(side="left", padx=(15, 0))

            # Details inner frame
            details = ctk.CTkFrame(row, fg_color="transparent")
            details.pack(side="left", padx=15, pady=10)

            word_lbl = ctk.CTkLabel(details, text=entry.word,
                                    font=ctk.CTkFont("Yu Gothic UI", 20, "bold"),
                                    text_color=Theme.TEXT)
            word_lbl.pack(anchor="w")

            romaji_lbl = ctk.CTkLabel(details, text=f"Romaji: {entry.romaji}",
                                      font=ctk.CTkFont(*Theme.SMALL),
                                      text_color=Theme.TEXT_MUTED)
            romaji_lbl.pack(anchor="w")

            meaning_lbl = ctk.CTkLabel(row, text=entry.meaning,
                                       font=ctk.CTkFont(*Theme.BODY),
                                       text_color=Theme.ACCENT_LIGHT)
            meaning_lbl.pack(side="left", padx=30)

            # Speak button
            btn_speak = ctk.CTkButton(row, text="🔊 Phát âm",
                                      font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                      fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                      text_color="white", corner_radius=8, width=100, height=32,
                                      command=lambda t=entry.word: speak_japanese_async(t))
            btn_speak.pack(side="right", padx=15)

    def _toggle_word_selection(self, idx: int, is_checked: bool):
        if is_checked:
            self.selected_indices.add(idx)
        else:
            self.selected_indices.discard(idx)
        if hasattr(self, 'lbl_select_count'):
            self.lbl_select_count.configure(
                text=f"📌 Đã chọn: {len(self.selected_indices)} / {len(self.words)} từ để học"
            )

    def _select_all_words(self):
        self.selected_indices = set(range(len(self.words)))
        self._on_tab_changed("Từ vựng")

    def _deselect_all_words(self):
        self.selected_indices.clear()
        self._on_tab_changed("Từ vựng")

    def _invert_word_selection(self):
        self.selected_indices = set(range(len(self.words))) - self.selected_indices
        self._on_tab_changed("Từ vựng")


    # ── Flashcards Tab ────────────────────────────────────────────────────

    def _build_flashcards_tab(self):
        active_words = self.get_selected_words()
        if not active_words:
            lbl = ctk.CTkLabel(self.active_frame,
                               text="⚠️ Chưa có từ vựng nào được chọn.\nVui lòng quay lại tab 'Từ vựng' và tích chọn các từ bạn muốn học!",
                               font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.WARNING, justify="center")
            lbl.pack(expand=True)
            return

        if self.fc_index >= len(active_words):
            self.fc_index = 0

        # Main Flashcard Frame
        self.fc_card = ctk.CTkFrame(self.active_frame, fg_color=Theme.CARD, corner_radius=20,
                                    border_width=2, border_color=Theme.ACCENT, width=460, height=280)
        self.fc_card.pack_propagate(False)
        self.fc_card.pack(pady=20)
        
        # Click card to flip
        self.fc_card.bind("<Button-1>", lambda _: self._flip_card())

        self.fc_content = ctk.CTkFrame(self.fc_card, fg_color="transparent")
        self.fc_content.pack(expand=True, fill="both", padx=20, pady=20)

        # Label inside card
        self.fc_text = ctk.CTkLabel(self.fc_content, text="",
                                    font=ctk.CTkFont("Yu Gothic UI", 48, "bold"),
                                    text_color=Theme.TEXT, wraplength=400)
        self.fc_text.pack(expand=True)
        self.fc_text.bind("<Button-1>", lambda _: self._flip_card())

        self.fc_subtext = ctk.CTkLabel(self.fc_content, text="Nhấn để lật thẻ",
                                       font=ctk.CTkFont(*Theme.SMALL),
                                       text_color=Theme.TEXT_MUTED)
        self.fc_subtext.pack(side="bottom")
        self.fc_subtext.bind("<Button-1>", lambda _: self._flip_card())

        # Control Row
        controls = ctk.CTkFrame(self.active_frame, fg_color="transparent")
        controls.pack(pady=10)

        btn_prev = ctk.CTkButton(controls, text="← Trước",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, width=100, height=36,
                                 command=self._prev_card)
        btn_prev.pack(side="left", padx=10)

        self.fc_progress_lbl = ctk.CTkLabel(controls, text="1 / 1",
                                            font=ctk.CTkFont(*Theme.BODY_BOLD),
                                            text_color=Theme.TEXT)
        self.fc_progress_lbl.pack(side="left", padx=15)

        btn_next = ctk.CTkButton(controls, text="Sau →",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, width=100, height=36,
                                 command=self._next_card)
        btn_next.pack(side="left", padx=10)

        # Bottom actions
        actions = ctk.CTkFrame(self.active_frame, fg_color="transparent")
        actions.pack(pady=5)

        btn_speak = ctk.CTkButton(actions, text="🔊 Phát âm",
                                  font=ctk.CTkFont(*Theme.BODY_BOLD),
                                  fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                  text_color="white", corner_radius=10, width=140, height=40,
                                  command=self._speak_current_card)
        btn_speak.pack(side="left", padx=8)

        btn_flip = ctk.CTkButton(actions, text="🔄 Lật thẻ",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                 text_color="white", corner_radius=10, width=140, height=40,
                                 command=self._flip_card)
        btn_flip.pack(side="left", padx=8)

        self._update_card_display()

    def _update_card_display(self):
        active_words = self.get_selected_words()
        if not active_words:
            return

        if self.fc_index >= len(active_words):
            self.fc_index = 0

        entry = active_words[self.fc_index]
        self.fc_progress_lbl.configure(text=f"{self.fc_index + 1} / {len(active_words)}")
        
        if self.fc_flipped:
            # Show translation and romaji
            self.fc_text.configure(text=f"{entry.meaning}\n({entry.romaji})",
                                   font=ctk.CTkFont(*Theme.HEADING),
                                   text_color=Theme.ACCENT_LIGHT)
            self.fc_card.configure(border_color=Theme.SUCCESS)
        else:
            # Show Japanese word
            self.fc_text.configure(text=entry.word,
                                   font=ctk.CTkFont("Yu Gothic UI", 48, "bold"),
                                   text_color=Theme.TEXT)
            self.fc_card.configure(border_color=Theme.ACCENT)

    def _flip_card(self):
        self.fc_flipped = not self.fc_flipped
        self._update_card_display()

    def _next_card(self):
        active_words = self.get_selected_words()
        if not active_words:
            return
        self.fc_index = (self.fc_index + 1) % len(active_words)
        self.fc_flipped = False
        self._update_card_display()

    def _prev_card(self):
        active_words = self.get_selected_words()
        if not active_words:
            return
        self.fc_index = (self.fc_index - 1 + len(active_words)) % len(active_words)
        self.fc_flipped = False
        self._update_card_display()

    def _speak_current_card(self):
        active_words = self.get_selected_words()
        if active_words and self.fc_index < len(active_words):
            entry = active_words[self.fc_index]
            speak_japanese_async(entry.word)

    # ── Practice/Quiz Tab ─────────────────────────────────────────────────

    def _build_practice_tab(self):
        card = ctk.CTkFrame(self.active_frame, fg_color=Theme.CARD, corner_radius=16,
                            border_width=1, border_color=Theme.BORDER)
        card.pack(expand=True, fill="both", padx=40, pady=20)

        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(expand=True)

        badge = ctk.CTkFrame(inner, fg_color=Theme.GOLD, corner_radius=12)
        badge.pack(pady=(0, 16))
        ctk.CTkLabel(badge, text="🏁  BẮT ĐẦU THỬ THÁCH",
                     font=ctk.CTkFont(*Theme.SMALL_BOLD),
                     text_color=Theme.BG).pack(padx=16, pady=4)

        title = ctk.CTkLabel(inner, text="Kiểm tra & Đánh giá",
                             font=ctk.CTkFont(*Theme.HEADING),
                             text_color=Theme.TEXT)
        title.pack(pady=4)

        selected_count = len(self.get_selected_words())
        total_count = len(self.words)

        status_lbl = ctk.CTkLabel(inner,
                                  text=f"📌 Đã chọn: {selected_count} / {total_count} từ để học",
                                  font=ctk.CTkFont(*Theme.BODY_BOLD),
                                  text_color=Theme.TEAL if selected_count > 0 else Theme.WARNING)
        status_lbl.pack(pady=4)

        desc = ctk.CTkLabel(inner, text="Bài thi bao gồm 2 phần:\n"
                                       "Phần 1: Trắc nghiệm nhập Romaji (Word → Romaji)\n"
                                       "Phần 2: Luyện tốc độ gõ (Speed Typing)\n\n"
                                       "Hoàn thành 100% để mở khóa bài học tiếp theo trên Bản đồ!",
                            font=ctk.CTkFont(*Theme.BODY),
                            text_color=Theme.TEXT_MUTED, justify="center")
        desc.pack(pady=12)

        # Reading Rules for Year / Birth Year lessons
        if self.topic_key in ("years", "birth_year"):
            rule_box = ctk.CTkFrame(inner, fg_color=Theme.SECTION_BG, corner_radius=8, border_width=1, border_color=Theme.BORDER)
            rule_box.pack(pady=10, fill="x")
            
            rule_title = ctk.CTkLabel(rule_box, text="💡 Quy tắc đọc năm trong tiếng Nhật:", font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.GOLD)
            rule_title.pack(anchor="w", padx=10, pady=(6, 2))
            
            if self.topic_key == "years":
                rule_text = ("• Quy tắc chung: Đọc các chữ số + 年 (ねん - nen)\n"
                             "• Ví dụ: 2025年 = 2025 + ねん = にせんにじゅうごねん (nisennijuugonen)\n"
                             "• Trường hợp đặc biệt:\n"
                             "  - 4年: よねん (yonen) - KHÔNG đọc là よんねん\n"
                             "  - 7年: しちねん (shichinen) hoặc ななねん (nananen)\n"
                             "  - 9年: くねん (kunen) - KHÔNG đọc là きゅうねん")
            else:
                rule_text = ("• Cách giới thiệu năm sinh: わたしha + [Năm] + 年生まれです (ねんうまれです)\n"
                             "• Ví dụ: わたしは2005年生まれです = watashi wa nisengonen umare desu\n"
                             "• 2004年生まれ = nisenyonen umare desu\n"
                             "• Nhập câu hoàn chỉnh ở Romaji (như 'watashi wa nisengonen umare desu')")
                             
            rule_lbl = ctk.CTkLabel(rule_box, text=rule_text, font=ctk.CTkFont(*Theme.SMALL), text_color=Theme.TEXT, justify="left")
            rule_lbl.pack(anchor="w", padx=10, pady=(0, 6))

        btn_start = ctk.CTkButton(inner, text="⛩  Bắt đầu Học & Kiểm tra",
                                  font=ctk.CTkFont("Yu Gothic UI", 16, "bold"),
                                  fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                  text_color="white", corner_radius=12, height=48, width=280,
                                  command=self._handle_start_quiz)
        btn_start.pack(pady=(16, 0))

        if self.topic_key in ("hiragana", "katakana"):
            btn_write = ctk.CTkButton(inner, text="✍️  Bắt đầu Luyện viết chữ",
                                      font=ctk.CTkFont("Yu Gothic UI", 16, "bold"),
                                      fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                      text_color="white", corner_radius=12, height=48, width=280,
                                      command=self._handle_start_handwriting)
            btn_write.pack(pady=(12, 0))

    def _handle_start_quiz(self):
        if not self.get_selected_words():
            messagebox.showwarning("Thông báo", "Vui lòng tích chọn ít nhất 1 từ vựng trong tab 'Từ vựng' để bắt đầu kiểm tra!")
            return
        if self.on_start_quiz:
            self.on_start_quiz()

    def _handle_start_handwriting(self):
        if not self.get_selected_words():
            messagebox.showwarning("Thông báo", "Vui lòng tích chọn ít nhất 1 từ vựng trong tab 'Từ vựng' để bắt đầu luyện viết!")
            return
        if self.on_start_handwriting:
            self.on_start_handwriting()

