"""
Central controller – wires model, views, and flow logic.
"""
import customtkinter as ctk
from model.app_model import AppModel, KanaType
from view.main_frame import MainFrame, \
    SCREEN_PART1, SCREEN_PART2, SCREEN_STAGE_DONE, \
    SCREEN_LEARNING_PATH, SCREEN_TOPIC_DETAILS, \
    SCREEN_VOCAB_PACKS, SCREEN_VOCAB_STUDY_HUB, \
    SCREEN_LEVEL1, SCREEN_LEVEL2, SCREEN_LEVEL3, SCREEN_LEVEL4, SCREEN_LEVEL5, \
    SCREEN_HANDWRITING
from handwriting import HandwritingScreen, HandwritingController
from view.screens.part1_screen import Part1Screen
from view.screens.part2_screen import Part2Screen
from view.screens.stage_done_screen import StageDoneScreen
from view.screens.learning_path_screen import LearningPathScreen
from view.screens.topic_details_screen import TopicDetailsScreen
from view.theme import Theme

from view.screens.vocab_packs_screen import VocabPacksScreen
from view.screens.vocab_study_hub_screen import VocabStudyHubScreen
from view.screens.level1_screen import Level1Screen
from view.screens.level2_screen import Level2Screen
from view.screens.level3_screen import Level3Screen
from view.screens.level4_screen import Level4Screen
from view.screens.level5_screen import Level5Screen


class AppController:

    def __init__(self):
        self.model = AppModel()
        self.frame = MainFrame()

        self.part1_screen = Part1Screen(self.frame.container)
        self.part2_screen = Part2Screen(self.frame.container)
        self.done_screen = StageDoneScreen(self.frame.container)
        self.learning_path_screen = LearningPathScreen(self.frame.container)
        self.topic_details_screen = TopicDetailsScreen(self.frame.container)

        self.vocab_packs_screen = VocabPacksScreen(self.frame.container, self.model)
        self.vocab_study_hub_screen = VocabStudyHubScreen(self.frame.container, self.model)
        self.level1_screen = Level1Screen(self.frame.container, self.model)
        self.level2_screen = Level2Screen(self.frame.container, self.model)
        self.level3_screen = Level3Screen(self.frame.container, self.model)
        self.level4_screen = Level4Screen(self.frame.container, self.model)
        self.level5_screen = Level5Screen(self.frame.container, self.model)

        self.handwriting_screen = HandwritingScreen(self.frame.container)
        self.handwriting_controller = HandwritingController(self.handwriting_screen, self.model, self.frame)

        self._register_screens()
        self._wire_part1_screen()
        self._wire_part2_screen()
        self._wire_done_screen()
        self._wire_new_screens()
        self._wire_vocab_v2_screens()

    def start(self):
        self.frame.show_screen(SCREEN_LEARNING_PATH)
        self.frame.mainloop()

    def _register_screens(self):
        self.frame.add_screen(SCREEN_PART1, self.part1_screen)
        self.frame.add_screen(SCREEN_PART2, self.part2_screen)
        self.frame.add_screen(SCREEN_STAGE_DONE, self.done_screen)
        self.frame.add_screen(SCREEN_LEARNING_PATH, self.learning_path_screen)
        self.frame.add_screen(SCREEN_TOPIC_DETAILS, self.topic_details_screen)
        self.frame.add_screen(SCREEN_VOCAB_PACKS, self.vocab_packs_screen)
        self.frame.add_screen(SCREEN_VOCAB_STUDY_HUB, self.vocab_study_hub_screen)
        self.frame.add_screen(SCREEN_LEVEL1, self.level1_screen)
        self.frame.add_screen(SCREEN_LEVEL2, self.level2_screen)
        self.frame.add_screen(SCREEN_LEVEL3, self.level3_screen)
        self.frame.add_screen(SCREEN_LEVEL4, self.level4_screen)
        self.frame.add_screen(SCREEN_LEVEL5, self.level5_screen)
        self.frame.add_screen(SCREEN_HANDWRITING, self.handwriting_screen)



    # ── Part 1 ────────────────────────────────────────────────────────────

    def _wire_part1_screen(self):
        def on_answer(typed: str):
            q = self.model.get_current_part1_question()
            if q is None:
                return

            # Only evaluate when user has typed enough characters
            if len(typed) < len(q.romaji):
                return

            correct = self.model.submit_part1_answer(typed)
            self.part1_screen.update_score(self.model.part1_correct, self.model.part1_mistakes)

            if not correct:
                msg = f'Sai: {q.word} là "{q.romaji}" (bạn nhập "{typed}")'
                self.part1_screen.show_toast(msg)
                self.model.advance_part1_after_wrong()
            else:
                self.part1_screen.flash_correct()

            if self.model.is_part1_complete():
                self._transition_to_part2()
            else:
                self._show_next_part1_question()

        self.part1_screen.set_on_answer(on_answer)

    # ── Part 2 ────────────────────────────────────────────────────────────

    def _wire_part2_screen(self):
        def on_word(typed: str):
            current = self.model.get_current_part2_item()
            if current is None:
                return

            if len(typed) < len(current.romaji):
                return

            correct = self.model.submit_part2_word(typed)
            self.part2_screen.update_stats(self.model.part2_correct, self.model.part2_mistakes)

            if correct:
                if self.model.is_part2_complete():
                    self._handle_part2_round_completion()
                else:
                    self.part2_screen.advance_to(self.model.part2_index, True)
            else:
                self.part2_screen.advance_after_wrong(self.model.part2_index)
                if self.model.is_part2_complete():
                    self._handle_part2_round_completion()

        self.part2_screen.set_on_word(on_word)

    def _handle_part2_round_completion(self):
        if self.model.has_next_part2_round():
            self.model.advance_part2_round()
            self.part2_screen.init_sequence(
                self.model.part2_sequence,
                self.model.part2_current_round,
                self.model.PART2_TOTAL_ROUNDS
            )
        else:
            self._finish_stage()

    # ── Done Screen ───────────────────────────────────────────────────────

    def _wire_done_screen(self):
        def on_repeat():
            self.model.start_new_stage()
            self._begin_part1()

        def on_next():
            self.learning_path_screen.refresh_map()
            self.frame.show_screen(SCREEN_LEARNING_PATH)

        def on_menu():
            self.learning_path_screen.refresh_map()
            self.frame.show_screen(SCREEN_LEARNING_PATH)

        self.done_screen.set_on_repeat(on_repeat)
        self.done_screen.set_on_next(on_next)
        self.done_screen.set_on_menu(on_menu)

    # ── Flow Helpers ──────────────────────────────────────────────────────

    def _start_new_stage(self):
        self.model.start_new_stage()
        self._begin_part1()

    def _begin_part1(self):
        stage_info = f"{self.topic_details_screen.topic_name} · Phần 1"
        self.part1_screen.set_stage_label(stage_info)
        self.part1_screen.update_score(0, 0)
        self._show_next_part1_question()
        self.frame.show_screen(SCREEN_PART1)

    def _show_next_part1_question(self):
        q = self.model.get_current_part1_question()
        if q is None:
            return
        idx = self.model.part1_question_index + 1
        total = len(self.model.part1_questions)
        self.part1_screen.show_question(q, idx, total)
        self.part1_screen.set_progress(idx - 1, total)

    def _transition_to_part2(self):
        self.model.start_part2()

        stage_info = f"{self.topic_details_screen.topic_name} · Phần 2"
        self.part2_screen.set_stage_label(stage_info)

        # Reset display
        self.part2_screen.update_stats(0, 0)
        self.part2_screen.update_timer(0)

        self.part2_screen.init_sequence(
            self.model.part2_sequence,
            self.model.part2_current_round,
            self.model.PART2_TOTAL_ROUNDS
        )

        # Start timer
        def tick():
            self.part2_screen.update_timer(self.model.get_part2_elapsed_seconds())
        self.part2_screen.start_timer(tick)

        self.frame.show_screen(SCREEN_PART2)

    def _finish_stage(self):
        self.part2_screen.stop_timer()

        p1_total = len(self.model.part1_questions)
        p2_total = self.model.get_part2_total_items()
        elapsed = self.model.get_part2_elapsed_seconds()
        missed = len(self.model.part1_missed)

        # Save progress as 100% completed
        self.model.progress[self.model.kana_type.value] = 100.0
        self.model.save_progress()

        self.done_screen.populate(
            self.model.current_stage_index + 1,
            self.model.part1_correct, p1_total,
            self.model.part2_correct, p2_total, self.model.part2_mistakes,
            elapsed, missed
        )

        self.frame.show_screen(SCREEN_STAGE_DONE)

    def _wire_new_screens(self):
        # Set getters for learning path screen progress
        self.learning_path_screen.set_progress_getters(
            self.model.get_topic_status,
            lambda: self.model.progress
        )
        
        # When a node is clicked in the learning path, open the topic details screen
        def on_node_click(topic_key, topic_name):
            if topic_key in ("hiragana", "katakana", "numbers"):
                self.topic_details_screen.set_topic(topic_key, topic_name)
                self.frame.show_screen(SCREEN_TOPIC_DETAILS)
            elif topic_key == "days_month":
                self._show_days_month_choice(self._open_study_hub)
            else:
                self._open_study_hub(topic_key)
            
        self.learning_path_screen.set_on_node_click(on_node_click)
        
        # Open Vocabulary Hub from map header button
        def on_vocab_hub_click():
            self.vocab_packs_screen.refresh_list()
            self.frame.show_screen(SCREEN_VOCAB_PACKS)
            
        self.learning_path_screen.set_on_vocab_hub_click(on_vocab_hub_click)
        
        # Back button on Topic Details returns to Learning Path
        def on_back():
            self.learning_path_screen.refresh_map()
            self.frame.show_screen(SCREEN_LEARNING_PATH)
            
        # Start Quiz on Topic Details starts stage
        def on_start_quiz():
            topic_key = self.topic_details_screen.topic_key
            self.model.kana_type = KanaType(topic_key)
            
            # Select the correct packages
            self.model.selected_packages = self.model.get_all_available_packages()
            
            # Start session
            self._start_new_stage()

            # Override part1 questions if user selected specific words
            selected_words = self.topic_details_screen.get_selected_words()
            if selected_words:
                import random
                pool = list(selected_words)
                random.shuffle(pool)
                self.model.part1_questions = pool
                self.model.part1_question_index = 0
                self._show_next_part1_question()
            
        def on_start_handwriting():
            topic_key = self.topic_details_screen.topic_key
            self.handwriting_controller.set_practice_category(topic_key)
            self.frame.show_screen(SCREEN_HANDWRITING)
            
        self.topic_details_screen.set_callbacks(on_back, on_start_quiz, on_start_handwriting)

    def _wire_vocab_v2_screens(self):
        # Vocab Packs Screen
        def on_vocab_packs_back():
            self.learning_path_screen.refresh_map()
            self.frame.show_screen(SCREEN_LEARNING_PATH)

        def on_select_pack(pack_id: str):
            if pack_id == "days_month":
                self._show_days_month_choice(self._open_study_hub)
            else:
                self._open_study_hub(pack_id)

        self.vocab_packs_screen.set_callbacks(on_vocab_packs_back, on_select_pack)

        # Vocab Study Hub Screen
        def on_study_hub_back():
            pack_id = self.vocab_study_hub_screen.pack.id if self.vocab_study_hub_screen.pack else ""
            if self.model.is_built_in_pack(pack_id):
                self.learning_path_screen.refresh_map()
                self.frame.show_screen(SCREEN_LEARNING_PATH)
            else:
                self.vocab_packs_screen.refresh_list()
                self.frame.show_screen(SCREEN_VOCAB_PACKS)

        def on_start_level(pack_id: str, level_num: int, selected_words=None):
            if level_num == 1:
                self.level1_screen.set_pack(pack_id, selected_words)
                self.frame.show_screen(SCREEN_LEVEL1)
            elif level_num == 2:
                self.level2_screen.set_pack(pack_id, selected_words)
                self.frame.show_screen(SCREEN_LEVEL2)
            elif level_num == 3:
                self.level3_screen.set_pack(pack_id, selected_words)
                self.frame.show_screen(SCREEN_LEVEL3)
            elif level_num == 4:
                self.level4_screen.set_pack(pack_id, selected_words)
                self.frame.show_screen(SCREEN_LEVEL4)
            elif level_num == 5:
                self.level5_screen.set_pack(pack_id, selected_words)
                self.frame.show_screen(SCREEN_LEVEL5)

        def on_start_handwriting(pack_id: str, selected_words=None):
            self.handwriting_controller.set_vocab_pack(pack_id, selected_words)
            self.frame.show_screen(SCREEN_HANDWRITING)

        self.vocab_study_hub_screen.set_callbacks(on_study_hub_back, on_start_level, on_start_handwriting)

        # Level screens back callbacks
        self.level1_screen.set_on_back(lambda: self._back_to_hub(self.level1_screen.pack))
        self.level2_screen.set_on_back(lambda: self._back_to_hub(self.level2_screen.pack))
        self.level3_screen.set_on_back(lambda: self._back_to_hub(self.level3_screen.pack))
        self.level4_screen.set_on_back(lambda: self._back_to_hub(self.level4_screen.pack))
        self.level5_screen.set_on_back(lambda: self._back_to_hub(self.level5_screen.pack))

    def _back_to_hub(self, pack):
        pack_id = pack.id if pack else ""
        self.vocab_study_hub_screen.set_pack(pack_id)
        self.frame.show_screen(SCREEN_VOCAB_STUDY_HUB)

    def _open_study_hub(self, pack_id: str):
        self.vocab_study_hub_screen.set_pack(pack_id)
        self.frame.show_screen(SCREEN_VOCAB_STUDY_HUB)

    def _show_days_month_choice(self, on_selected):
        choices = [
            ("Lựa chọn 1: Học cả 31 ngày", "days_month", "accent"),
            ("Lựa chọn 2: Chỉ học ngày đặc biệt (1-10, 14, 20, 24)", "days_month_special", "teal")
        ]
        InAppChoiceModal(self.frame.container, "Chọn phạm vi bài học:", choices, on_selected)


class InAppChoiceModal(ctk.CTkFrame):
    def __init__(self, parent_container, title_text, choices, on_select):
        # Fullscreen dark overlay backdrop
        super().__init__(parent_container, fg_color="#070712")
        self.grid(row=0, column=0, sticky="nsew")
        self.tkraise()

        # Center Card
        card = ctk.CTkFrame(self, fg_color=Theme.CARD, corner_radius=16, border_width=1, border_color=Theme.BORDER, width=440, height=250)
        card.place(relx=0.5, rely=0.5, anchor="center")
        card.pack_propagate(False)

        ctk.CTkLabel(card, text=title_text,
                     font=ctk.CTkFont(*Theme.SUBHEADING),
                     text_color=Theme.TEXT).pack(pady=(25, 15))

        for display_text, mode_val, color_theme in choices:
            btn_color = Theme.ACCENT if color_theme == "accent" else Theme.TEAL
            btn = ctk.CTkButton(card, text=display_text,
                                font=ctk.CTkFont(*Theme.BODY_BOLD),
                                fg_color=btn_color, hover_color=Theme.ACCENT_GLOW,
                                text_color="white", height=40, width=340, corner_radius=8,
                                command=lambda m=mode_val: self._select(m, on_select))
            btn.pack(pady=6)

        # Cancel button
        btn_cancel = ctk.CTkButton(card, text="Hủy",
                                   font=ctk.CTkFont(*Theme.BODY_BOLD),
                                   fg_color=Theme.SURFACE, hover_color=Theme.CARD_HOVER,
                                   text_color=Theme.TEXT, height=32, width=100, corner_radius=8,
                                   command=self.destroy)
        btn_cancel.pack(pady=(12, 0))

    def _select(self, val, callback):
        self.destroy()
        callback(val)
