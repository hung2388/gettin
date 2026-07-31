"""
Vocabulary Packs Screen - Lists all active packs, lets users study, 
and supports CRUD + import/export for custom packs.
"""
import json
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
from typing import Callable, List, Optional

from data.word_data import WordEntry, VocabPack
from view.theme import Theme


class VocabPacksScreen(ctk.CTkFrame):

    def __init__(self, master, model):
        super().__init__(master, fg_color=Theme.BG)
        self.model = model
        self.on_back: Optional[Callable] = None
        self.on_select_pack: Optional[Callable[[str], None]] = None

        # ── Top accent bar ────────────────────────────────────────────────
        accent_bar = ctk.CTkFrame(self, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent_bar.pack(fill="x", side="top")

        # ── Header ────────────────────────────────────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(20, 10))

        btn_back = ctk.CTkButton(header, text="← Quay lại Lộ trình",
                                 font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                 fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                 text_color=Theme.TEXT, corner_radius=8, height=32, width=150,
                                 command=self._handle_back)
        btn_back.pack(side="left")

        title_lbl = ctk.CTkLabel(header, text="Kho Từ Vựng Tiếng Nhật 🎌",
                                 font=ctk.CTkFont(*Theme.HEADING),
                                 text_color=Theme.TEXT)
        title_lbl.pack(side="right", padx=10)

        # ── Action Bar (Create, Import) ───────────────────────────────────
        action_bar = ctk.CTkFrame(self, fg_color=Theme.CARD, corner_radius=12,
                                  border_width=1, border_color=Theme.BORDER)
        action_bar.pack(fill="x", padx=40, pady=10)

        ctk.CTkLabel(action_bar, text="Quản lý chủ đề tự học:",
                     font=ctk.CTkFont(*Theme.BODY_BOLD),
                     text_color=Theme.TEXT_MUTED).pack(side="left", padx=20, pady=12)

        btn_create = ctk.CTkButton(action_bar, text="➕ Tạo Pack Mới",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                   text_color="white", corner_radius=8, height=32,
                                   command=self._on_create_click)
        btn_create.pack(side="right", padx=10)

        btn_import = ctk.CTkButton(action_bar, text="📥 Nhập Pack (Import)",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                   text_color="white", corner_radius=8, height=32,
                                   command=self._on_import_click)
        btn_import.pack(side="right", padx=10)

        # ── Packs Container ───────────────────────────────────────────────
        self.list_frame = ctk.CTkScrollableFrame(self, fg_color=Theme.BG_GRADIENT,
                                                 corner_radius=16, border_width=1,
                                                 border_color=Theme.BORDER)
        self.list_frame.pack(fill="both", expand=True, padx=40, pady=(10, 20))

    def set_callbacks(self, on_back: Callable, on_select_pack: Callable[[str], None]):
        self.on_back = on_back
        self.on_select_pack = on_select_pack

    def _handle_back(self):
        if self.on_back:
            self.on_back()

    def refresh_list(self):
        # Clear list
        for widget in self.list_frame.winfo_children():
            widget.destroy()

        packs = self.model.get_all_vocab_packs()

        for idx, pack in enumerate(packs):
            card = ctk.CTkFrame(self.list_frame, fg_color=Theme.CARD, corner_radius=12,
                                border_width=1, border_color=Theme.BORDER)
            card.pack(fill="x", pady=6, padx=10)

            # Details
            details = ctk.CTkFrame(card, fg_color="transparent")
            details.pack(side="left", padx=20, pady=12, fill="both", expand=True)

            # Title Row with badge
            title_row = ctk.CTkFrame(details, fg_color="transparent")
            title_row.pack(anchor="w")

            title_lbl = ctk.CTkLabel(title_row, text=pack.name,
                                     font=ctk.CTkFont(*Theme.SUBHEADING),
                                     text_color=Theme.TEXT)
            title_lbl.pack(side="left", anchor="w")

            # Badge
            if pack.id == "review_all":
                badge_bg = Theme.GOLD
                badge_text = "💡 Ôn tập"
                badge_fg = "black"
            elif pack.is_custom:
                badge_bg = Theme.TEAL
                badge_text = "✨ Tự chọn"
                badge_fg = "white"
            else:
                badge_bg = Theme.SURFACE
                badge_text = "🎌 Hệ thống"
                badge_fg = Theme.TEXT

            badge = ctk.CTkFrame(title_row, fg_color=badge_bg, corner_radius=6)
            badge.pack(side="left", padx=12)
            ctk.CTkLabel(badge, text=badge_text,
                         font=ctk.CTkFont("Yu Gothic UI", 9, "bold"),
                         text_color=badge_fg).pack(padx=8, pady=2)

            # Description
            desc_text = f"{pack.description} · ({len(pack.words)} từ)"
            desc_lbl = ctk.CTkLabel(details, text=desc_text,
                                    font=ctk.CTkFont(*Theme.SMALL),
                                    text_color=Theme.TEXT_MUTED)
            desc_lbl.pack(anchor="w", pady=(4, 0))

            # Buttons Container
            btns = ctk.CTkFrame(card, fg_color="transparent")
            btns.pack(side="right", padx=20, pady=12)

            btn_study = ctk.CTkButton(btns, text="🎯 Học ngay",
                                      font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                      fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_GLOW,
                                      text_color="white", corner_radius=8, width=100, height=32,
                                      command=lambda p_id=pack.id: self._study_pack(p_id))
            btn_study.pack(side="right", padx=4)

            # If custom, allow edit / delete / export
            if pack.is_custom:
                btn_delete = ctk.CTkButton(btns, text="🗑️",
                                           font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                           fg_color=Theme.ERROR_DARK, hover_color=Theme.ERROR,
                                           text_color="white", corner_radius=8, width=32, height=32,
                                           command=lambda p_id=pack.id: self._delete_pack(p_id))
                btn_delete.pack(side="right", padx=4)

                btn_edit = ctk.CTkButton(btns, text="✏️ Sửa",
                                         font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                         fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                         text_color="white", corner_radius=8, width=70, height=32,
                                         command=lambda p=pack: self._open_pack_editor(p))
                btn_edit.pack(side="right", padx=4)

                btn_export = ctk.CTkButton(btns, text="📤 Xuất",
                                           font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                           fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                           text_color="white", corner_radius=8, width=70, height=32,
                                           command=lambda p=pack: self._export_pack(p))
                btn_export.pack(side="right", padx=4)

    def _study_pack(self, pack_id: str):
        if self.on_select_pack:
            self.on_select_pack(pack_id)

    def _delete_pack(self, pack_id: str):
        if messagebox.askyesno("Xác nhận xóa", "Bạn có chắc chắn muốn xóa chủ đề tự chọn này không?"):
            self.model.delete_custom_pack(pack_id)
            self.refresh_list()

    def _on_create_click(self):
        self._open_pack_editor(None)

    def _open_pack_editor(self, pack: Optional[VocabPack]):
        # Modal window for creating/editing pack
        editor = ctk.CTkToplevel(self)
        editor.title("Tạo/Chỉnh sửa chủ đề tự học" if not pack else f"Sửa chủ đề: {pack.name}")
        editor.geometry("720x600")
        editor.configure(fg_color=Theme.BG)
        editor.transient(self.master.winfo_toplevel())
        editor.grab_set()

        # Center window
        editor.update_idletasks()
        pw, ph = editor.winfo_width(), editor.winfo_height()
        sw, sh = editor.winfo_screenwidth(), editor.winfo_screenheight()
        x, y = (sw - pw) // 2, (sh - ph) // 2
        editor.geometry(f"+{x}+{y}")

        # Top banner
        accent = ctk.CTkFrame(editor, fg_color=Theme.ACCENT, height=3, corner_radius=0)
        accent.pack(fill="x")

        form = ctk.CTkFrame(editor, fg_color="transparent")
        form.pack(fill="both", expand=True, padx=30, pady=20)

        # Pack Name & Desc
        lbl_name = ctk.CTkLabel(form, text="Tên chủ đề:", font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT)
        lbl_name.grid(row=0, column=0, sticky="w", pady=5)
        
        ent_name = ctk.CTkEntry(form, placeholder_text="Ví dụ: JLPT N5 - Động từ", font=ctk.CTkFont(*Theme.BODY), width=480)
        ent_name.grid(row=0, column=1, sticky="w", padx=10, pady=5)
        if pack:
            ent_name.insert(0, pack.name)

        lbl_desc = ctk.CTkLabel(form, text="Mô tả:", font=ctk.CTkFont(*Theme.BODY_BOLD), text_color=Theme.TEXT)
        lbl_desc.grid(row=1, column=0, sticky="w", pady=5)
        
        ent_desc = ctk.CTkEntry(form, placeholder_text="Mô tả ngắn gọn về chủ đề này", font=ctk.CTkFont(*Theme.BODY), width=480)
        ent_desc.grid(row=1, column=1, sticky="w", padx=10, pady=5)
        if pack:
            ent_desc.insert(0, pack.description)

        # Word list label
        lbl_words = ctk.CTkLabel(form, text="Danh sách từ vựng:", font=ctk.CTkFont(*Theme.SUBHEADING), text_color=Theme.TEXT)
        lbl_words.grid(row=2, column=0, columnspan=2, sticky="w", pady=(15, 5))

        # Words scroll container
        words_scroll = ctk.CTkScrollableFrame(form, fg_color=Theme.BG_GRADIENT, height=300, width=640,
                                              border_width=1, border_color=Theme.BORDER)
        words_scroll.grid(row=3, column=0, columnspan=2, sticky="nsew", pady=5)

        # Header row inside words scroll
        grid_header = ctk.CTkFrame(words_scroll, fg_color="transparent")
        grid_header.pack(fill="x", pady=(0, 4))
        
        headers = [("Từ mới/Kanji", 140), ("Kana", 140), ("Romaji", 140), ("Nghĩa tiếng Việt", 140)]
        for h_text, h_width in headers:
            ctk.CTkLabel(grid_header, text=h_text, font=ctk.CTkFont(*Theme.SMALL_BOLD), text_color=Theme.TEXT_MUTED, width=h_width).pack(side="left", padx=2)

        # List to hold row references
        word_rows = []

        def add_word_row(word="", kana="", romaji="", meaning=""):
            row_frame = ctk.CTkFrame(words_scroll, fg_color="transparent")
            row_frame.pack(fill="x", pady=2)

            ent_word = ctk.CTkEntry(row_frame, font=ctk.CTkFont(*Theme.SMALL), width=140)
            ent_word.pack(side="left", padx=2)
            ent_word.insert(0, word)

            ent_kana = ctk.CTkEntry(row_frame, font=ctk.CTkFont(*Theme.SMALL), width=140)
            ent_kana.pack(side="left", padx=2)
            ent_kana.insert(0, kana)

            ent_romaji = ctk.CTkEntry(row_frame, font=ctk.CTkFont(*Theme.SMALL), width=140)
            ent_romaji.pack(side="left", padx=2)
            ent_romaji.insert(0, romaji)

            ent_meaning = ctk.CTkEntry(row_frame, font=ctk.CTkFont(*Theme.SMALL), width=140)
            ent_meaning.pack(side="left", padx=2)
            ent_meaning.insert(0, meaning)

            btn_del = ctk.CTkButton(row_frame, text="X", fg_color=Theme.ERROR_DARK, hover_color=Theme.ERROR,
                                     width=26, height=26, font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                     command=lambda: remove_word_row(row_frame))
            btn_del.pack(side="left", padx=4)

            row_data = (row_frame, ent_word, ent_kana, ent_romaji, ent_meaning)
            word_rows.append(row_data)

        def remove_word_row(row_frame):
            nonlocal word_rows
            row_frame.destroy()
            word_rows = [r for r in word_rows if r[0] != row_frame]

        # Initialize existing words if editing
        if pack:
            for w in pack.words:
                add_word_row(w.word, w.kana, w.romaji, w.meaning)
        else:
            # Show a blank row initially
            add_word_row()

        # Add more row button
        btn_add_row = ctk.CTkButton(form, text="➕ Thêm từ",
                                    font=ctk.CTkFont(*Theme.SMALL_BOLD),
                                    fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                    text_color="white", corner_radius=8, width=100, height=28,
                                    command=lambda: add_word_row())
        btn_add_row.grid(row=4, column=0, columnspan=2, sticky="w", pady=10)

        # Dialog buttons row
        btn_row = ctk.CTkFrame(form, fg_color="transparent")
        btn_row.grid(row=5, column=0, columnspan=2, sticky="e", pady=(15, 0))

        def save():
            name = ent_name.get().strip()
            desc = ent_desc.get().strip()
            if not name:
                messagebox.showerror("Lỗi", "Vui lòng nhập tên chủ đề!")
                return

            words = []
            for _, ent_w, ent_k, ent_r, ent_m in word_rows:
                w_str = ent_w.get().strip()
                k_str = ent_k.get().strip()
                r_str = ent_r.get().strip()
                m_str = ent_m.get().strip()
                if w_str or k_str or r_str or m_str:
                    words.append(WordEntry(word=w_str, kana=k_str, romaji=r_str, meaning=m_str))

            if not words:
                messagebox.showerror("Lỗi", "Vui lòng thêm ít nhất một từ vựng!")
                return

            if pack:
                self.model.update_custom_pack(pack.id, name, desc, words)
            else:
                self.model.add_custom_pack(name, desc, words)

            editor.destroy()
            self.refresh_list()

        btn_save = ctk.CTkButton(btn_row, text="💾 Lưu chủ đề",
                                 font=ctk.CTkFont(*Theme.BODY_BOLD),
                                 fg_color=Theme.TEAL, hover_color=Theme.ACCENT_GLOW,
                                 text_color="white", corner_radius=10, width=120, height=36,
                                 command=save)
        btn_save.pack(side="right", padx=5)

        btn_cancel = ctk.CTkButton(btn_row, text="Hủy",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                   text_color=Theme.TEXT, corner_radius=10, width=100, height=36,
                                   command=editor.destroy)
        btn_cancel.pack(side="right", padx=5)

    def _export_pack(self, pack: VocabPack):
        words_data = [
            {
                "word": w.word,
                "kana": w.kana,
                "romaji": w.romaji,
                "meaning": w.meaning
            }
            for w in pack.words
        ]
        pack_data = {
            "name": pack.name,
            "description": pack.description,
            "words": words_data
        }
        json_str = json.dumps(pack_data, indent=4, ensure_ascii=False)

        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")],
            initialfile=f"{pack.name}.json",
            title="Xuất chủ đề học tập"
        )
        if file_path:
            try:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(json_str)
                messagebox.showinfo("Thành công", f"Đã xuất file thành công tại:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể xuất file:\n{e}")

    def _on_import_click(self):
        file_path = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json")],
            title="Nhập chủ đề học tập từ file"
        )
        if file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if not isinstance(data, dict) or "name" not in data or "words" not in data:
                    raise ValueError("File JSON không đúng cấu trúc (thiếu 'name' hoặc 'words').")

                words = [
                    WordEntry(
                        word=w["word"],
                        romaji=w["romaji"],
                        meaning=w["meaning"],
                        kana=w.get("kana", "")
                    )
                    for w in data["words"]
                ]
                if not words:
                    raise ValueError("Danh sách từ vựng trống!")

                name = data["name"]
                desc = data.get("description", "Nhập từ file JSON")
                
                self.model.add_custom_pack(name, desc, words)
                self.refresh_list()
                messagebox.showinfo("Thành công", f"Đã nhập thành công chủ đề: {name}!")

            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể nhập file JSON:\n{e}")
