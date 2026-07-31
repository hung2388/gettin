"""
Vocabulary Study Hub Screen - Contains Vocab list (with TTS), Flashcards,
and the entry point for the 5 active recall learning levels.
"""
import customtkinter as ctk
import subprocess
import threading
from typing import Callable, List, Optional

from data.word_data import WordEntry, VocabPack
from view.theme import Theme


def speak_japanese_async(text: str):
    """Speaks Japanese text asynchronously using native Windows TTS."""
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


class VocabStudyHubScreen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.pack: Optional[VocabPack] = None
        self.words: List[WordEntry] = []

        # Flashcard state
        self.fc_index: int = 0
        self.fc_flipped: bool = False

        self.on_back: Optional[Callable] = None
        self.on_start_level: Optional[Callable[[str, int], None]] = None
        self.on_start_handwriting: Optional[Callable[[str], None]] = None

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Header ────────────────────────────────────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(20, 10))

        btn_back = ctk.CTkButton(header, text="← Quay lại Kho từ vựng",
                                 font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, height=32, width=170,
                                 command=self._handle_back)
        btn_back.pack(side="left")

        self.title_label = ctk.CTkLabel(header, text="Topic Name",
                                        font=ctk.CTkFont(*Theme.HEADING),
                                        text_color=Theme.TEXT)
        self.title_label.pack(side="right", padx=10)

        # ── Tab Navigation ────────────────────────────────────────────────
        self.tab_var = ctk.StringVar(value="Từ vựng")
        self.tab_selector = ctk.CTkSegmentedButton(self, values=["Từ vựng", "Flashcards", "Luyện tập (Levels)"],
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

        self.active_frame: Optional[ctk.CTkFrame] = None

    def set_pack(self, pack_id: str):
        self.pack = self.model.get_vocab_pack(pack_id)
        if self.pack:
            self.title_label.configure(text=self.pack.name)
            self.words = self.pack.words
        else:
            self.words = []
            
        self.fc_index = 0
        self.fc_flipped = False
        self._on_tab_changed(self.tab_var.get())

    def set_callbacks(self, on_back: Callable, on_start_level: Callable[[str, int], None], on_start_handwriting: Callable[[str], None]):
        self.on_back = on_back
        self.on_start_level = on_start_level
        self.on_start_handwriting = on_start_handwriting

    def _handle_back(self):
        if self.on_back:
            self.on_back()

    def _on_tab_changed(self, tab_name: str):
        if self.active_frame:
            self.active_frame.destroy()

        self.active_frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.active_frame.pack(fill="both", expand=True, padx=20, pady=15)

        if tab_name == "Từ vựng":
            self._build_vocab_tab()
        elif tab_name == "Flashcards":
            self._build_flashcards_tab()
        else:
            self._build_levels_tab()

    # ── Vocab Tab ─────────────────────────────────────────────────────────

    def _build_vocab_tab(self):
        if not self.words:
            lbl = ctk.CTkLabel(self.active_frame, text="Không có từ vựng nào trong chủ đề này.",
                               font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED)
            lbl.pack(expand=True)
            return

        scroll = ctk.CTkScrollableFrame(self.active_frame, fg_color="transparent",
                                        scrollbar_button_color=Theme.ACCENT,
                                        scrollbar_button_hover_color=Theme.ACCENT_LIGHT)
        scroll.pack(fill="both", expand=True)

        for idx, entry in enumerate(self.words):
            row = ctk.CTkFrame(scroll, fg_color=Theme.CARD, corner_radius=10,
                               border_width=1, border_color=Theme.BORDER)
            row.pack(fill="x", pady=4, padx=5)

            details = ctk.CTkFrame(row, fg_color="transparent")
            details.pack(side="left", padx=15, pady=10)

            # Show Kanji (if different from Kana) or just Word
            word_text = entry.word
            if entry.kana and entry.kana != entry.word:
                word_text = f"{entry.word} [{entry.kana}]"

            word_lbl = ctk.CTkLabel(details, text=word_text,
                                    font=ctk.CTkFont("Yu Gothic UI", 18, "bold"),
                                    text_color=Theme.TEXT)
            word_lbl.pack(anchor="w")

            romaji_lbl = ctk.CTkLabel(details, text=f"Romaji: {entry.romaji}",
                                      font=ctk.CTkFont(*Theme.SMALL),
                                      text_color=Theme.TEXT_MUTED)
            romaji_lbl.pack(anchor="w")

            meaning_lbl = ctk.CTkLabel(row, text=entry.meaning,
                                       font=ctk.CTkFont(*Theme.BODY_BOLD),
                                       text_color=Theme.ACCENT_LIGHT)
            meaning_lbl.pack(side="left", padx=30)

            # Speak button
            btn_speak = ctk.CTkButton(row, text="🔊 Phát âm",
                                      font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                      fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                      text_color="white", corner_radius=8, width=100, height=32,
                                      command=lambda t=entry.word: speak_japanese_async(t))
            btn_speak.pack(side="right", padx=15)

    # ── Flashcards Tab ────────────────────────────────────────────────────

    def _build_flashcards_tab(self):
        if not self.words:
            lbl = ctk.CTkLabel(self.active_frame, text="Không có flashcard nào.",
                               font=ctk.CTkFont(*Theme.BODY), text_color=Theme.TEXT_MUTED)
            lbl.pack(expand=True)
            return

        self.fc_card = ctk.CTkFrame(self.active_frame, fg_color=Theme.CARD, corner_radius=20,
                                    border_width=2, border_color=Theme.ACCENT, width=460, height=260)
        self.fc_card.pack_propagate(False)
        self.fc_card.pack(pady=15)
        self.fc_card.bind("<Button-1>", lambda _: self._flip_card())

        self.fc_content = ctk.CTkFrame(self.fc_card, fg_color="transparent")
        self.fc_content.pack(expand=True, fill="both", padx=20, pady=20)
        self.fc_content.bind("<Button-1>", lambda _: self._flip_card())

        self.fc_text = ctk.CTkLabel(self.fc_content, text="",
                                    font=ctk.CTkFont("Yu Gothic UI", 40, "bold"),
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
        controls.pack(pady=8)

        btn_prev = ctk.CTkButton(controls, text="← Trước",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, width=90, height=36,
                                 command=self._prev_card)
        btn_prev.pack(side="left", padx=10)

        self.fc_progress_lbl = ctk.CTkLabel(controls, text="1 / 1",
                                            font=ctk.CTkFont(*Theme.BODY_BOLD),
                                            text_color=Theme.TEXT)
        self.fc_progress_lbl.pack(side="left", padx=15)

        btn_next = ctk.CTkButton(controls, text="Sau →",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, width=90, height=36,
                                 command=self._next_card)
        btn_next.pack(side="left", padx=10)

        # Bottom actions
        actions = ctk.CTkFrame(self.active_frame, fg_color="transparent")
        actions.pack(pady=5)

        btn_speak = ctk.CTkButton(actions, text="🔊 Phát âm",
                                  font=ctk.CTkFont(*Theme.BODY_BOLD),
                                  fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                  text_color="white", corner_radius=10, width=130, height=36,
                                  command=self._speak_current_card)
        btn_speak.pack(side="left", padx=8)

        btn_flip = ctk.CTkButton(actions, text="🔄 Lật thẻ",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                 text_color="white", corner_radius=10, width=130, height=36,
                                 command=self._flip_card)
        btn_flip.pack(side="left", padx=8)

        self._update_card_display()

    def _update_card_display(self):
        entry = self.words[self.fc_index]
        self.fc_progress_lbl.configure(text=f"{self.fc_index + 1} / {len(self.words)}")
        
        if self.fc_flipped:
            display_text = f"{entry.meaning}\n\n"
            if entry.kana and entry.kana != entry.word:
                display_text += f"Kana: {entry.kana}\n"
            display_text += f"Romaji: {entry.romaji}"
            
            self.fc_text.configure(text=display_text,
                                   font=ctk.CTkFont(*Theme.SUBHEADING),
                                   text_color=Theme.ACCENT_LIGHT)
            self.fc_card.configure(border_color=Theme.SUCCESS)
        else:
            self.fc_text.configure(text=entry.word,
                                   font=ctk.CTkFont("Yu Gothic UI", 44, "bold"),
                                   text_color=Theme.TEXT)
            self.fc_card.configure(border_color=Theme.ACCENT)

    def _flip_card(self):
        self.fc_flipped = not self.fc_flipped
        self._update_card_display()

    def _next_card(self):
        self.fc_index = (self.fc_index + 1) % len(self.words)
        self.fc_flipped = False
        self._update_card_display()

    def _prev_card(self):
        self.fc_index = (self.fc_index - 1 + len(self.words)) % len(self.words)
        self.fc_flipped = False
        self._update_card_display()

    def _speak_current_card(self):
        entry = self.words[self.fc_index]
        speak_japanese_async(entry.word)

    # ── Levels Tab (Practice Options) ─────────────────────────────────────

    def _build_levels_tab(self):
        scroll = ctk.CTkScrollableFrame(self.active_frame, fg_color="transparent")
        scroll.pack(fill="both", expand=True)

        # If pack supports 2-section layout (Vocabulary Practice + Handwriting Practice)
        if self.pack and getattr(self.pack, "supports_handwriting", False):
            # Section 1: Học Nghĩa (Typing & MC Quiz)
            sec1_header = ctk.CTkFrame(scroll, fg_color="transparent")
            sec1_header.pack(fill="x", pady=(10, 5), padx=10)
            ctk.CTkLabel(sec1_header, text="Phần 1: Học Nghĩa (Vocabulary Practice)",
                         font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.GOLD).pack(side="left")

            levels_data = [
                (1, "🎯 Level 1: Learn & Multiple Choice", "Học từ mới qua 2 câu hỏi trắc nghiệm đồng thời (chọn Kana & Nghĩa)."),
                (2, "🤔 Level 2: Recall", "Chủ động hồi tưởng từ vựng. Nhìn nghĩa tiếng Việt để gõ lại Kanji/Kana."),
                (3, "🎧 Level 3: Listening Test", "Nghe hệ thống phát âm 10 từ liên tiếp, sau đó có 20 giây để điền nghĩa tiếng Việt."),
                (4, "🧩 Level 4: Word Matching", "Ghép nối bộ ba tương ứng: Kanji ↔️ Kana ↔️ Nghĩa tiếng Việt."),
                (5, "⚡ Level 5: Speed Typing", "Shuffle ngẫu nhiên các từ và luyện gõ tốc độ (gõ Romaji liên tục không cần Enter).")
            ]

            for num, title, desc in levels_data:
                row = ctk.CTkFrame(scroll, fg_color=Theme.CARD, corner_radius=12,
                                   border_width=1, border_color=Theme.BORDER)
                row.pack(fill="x", pady=4, padx=10)

                details = ctk.CTkFrame(row, fg_color="transparent")
                details.pack(side="left", padx=20, pady=12, fill="both", expand=True)

                title_lbl = ctk.CTkLabel(details, text=title, font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.TEXT)
                title_lbl.pack(anchor="w")

                desc_lbl = ctk.CTkLabel(details, text=desc, font=ctk.CTkFont(*Theme.SMALL), text_color=Theme.TEXT_MUTED, wraplength=480, justify="left")
                desc_lbl.pack(anchor="w", pady=(2, 0))

                btn_start = ctk.CTkButton(row, text="Bắt đầu ⛩",
                                          font=ctk.CTkFont(*Theme.BODY_BOLD),
                                          fg_color=Theme.TEAL if num == 1 else Theme.ACCENT,
                                          hover_color=Theme.ACCENT_GLOW,
                                          text_color="white", corner_radius=8, width=120, height=36,
                                          command=lambda n=num: self._start_level(n))
                btn_start.pack(side="right", padx=20, pady=12)

            # Section 2: Học viết Kanji/Kana (Handwriting)
            sec2_header = ctk.CTkFrame(scroll, fg_color="transparent")
            sec2_header.pack(fill="x", pady=(20, 5), padx=10)
            ctk.CTkLabel(sec2_header, text="Phần 2: Học viết Kanji & Kana (Handwriting Practice)",
                         font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.GOLD).pack(side="left")

            row = ctk.CTkFrame(scroll, fg_color=Theme.CARD, corner_radius=12,
                               border_width=1, border_color=Theme.BORDER)
            row.pack(fill="x", pady=4, padx=10)

            details = ctk.CTkFrame(row, fg_color="transparent")
            details.pack(side="left", padx=20, pady=12, fill="both", expand=True)

            title_lbl = ctk.CTkLabel(details, text="✍️ Luyện viết cả từ (Handwriting)", font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.TEXT)
            title_lbl.pack(anchor="w")

            desc_lbl = ctk.CTkLabel(details, text="Học viết cả từ Kanji và Kana side-by-side từ nghĩa tiếng Việt bằng chuột vẽ.",
                                    font=ctk.CTkFont(*Theme.SMALL), text_color=Theme.TEXT_MUTED, wraplength=480, justify="left")
            desc_lbl.pack(anchor="w", pady=(2, 0))

            btn_start = ctk.CTkButton(row, text="Luyện viết ⛩",
                                      font=ctk.CTkFont(*Theme.BODY_BOLD),
                                      fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                      text_color="white", corner_radius=8, width=120, height=36,
                                      command=self._start_handwriting)
            btn_start.pack(side="right", padx=20, pady=12)

        else:
            # Standard single-section layout
            levels_data = [
                (1, "🎯 Level 1: Learn & Multiple Choice", "Học từ mới qua 2 câu hỏi trắc nghiệm đồng thời (chọn Kana & Nghĩa)."),
                (2, "🤔 Level 2: Recall", "Chủ động hồi tưởng từ vựng. Nhìn nghĩa tiếng Việt để gõ lại Kanji/Kana."),
                (3, "🎧 Level 3: Listening Test", "Nghe hệ thống phát âm 10 từ liên tiếp, sau đó có 20 giây để điền nghĩa tiếng Việt."),
                (4, "🧩 Level 4: Word Matching", "Ghép nối bộ ba tương ứng: Kanji ↔️ Kana ↔️ Nghĩa tiếng Việt."),
                (5, "⚡ Level 5: Speed Typing", "Shuffle ngẫu nhiên các từ và luyện gõ tốc độ (gõ Romaji liên tục không cần Enter).")
            ]

            for num, title, desc in levels_data:
                row = ctk.CTkFrame(scroll, fg_color=Theme.CARD, corner_radius=12,
                                   border_width=1, border_color=Theme.BORDER)
                row.pack(fill="x", pady=6, padx=10)

                details = ctk.CTkFrame(row, fg_color="transparent")
                details.pack(side="left", padx=20, pady=12, fill="both", expand=True)

                title_lbl = ctk.CTkLabel(details, text=title, font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.TEXT)
                title_lbl.pack(anchor="w")

                desc_lbl = ctk.CTkLabel(details, text=desc, font=ctk.CTkFont(*Theme.SMALL), text_color=Theme.TEXT_MUTED, wraplength=480, justify="left")
                desc_lbl.pack(anchor="w", pady=(2, 0))

                btn_start = ctk.CTkButton(row, text="Bắt đầu ⛩",
                                          font=ctk.CTkFont(*Theme.BODY_BOLD),
                                          fg_color=Theme.TEAL if num == 1 else Theme.ACCENT,
                                          hover_color=Theme.ACCENT_GLOW,
                                          text_color="white", corner_radius=8, width=120, height=36,
                                          command=lambda n=num: self._start_level(n))
                btn_start.pack(side="right", padx=20, pady=12)

    def _start_level(self, level_num: int):
        if self.pack and self.on_start_level:
            self.on_start_level(self.pack.id, level_num)

    def _start_handwriting(self):
        if self.pack and self.on_start_handwriting:
            self.on_start_handwriting(self.pack.id)
