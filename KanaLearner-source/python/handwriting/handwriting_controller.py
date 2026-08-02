import os
import numpy as np
from PIL import Image
from typing import List, Dict, Optional
from model.app_model import AppModel, KanaType
from .handwriting_processor import HandwritingProcessor
from .recognizer import TemplateRecognizer
from .handwriting_screen import HandwritingScreen
from view.main_frame import SCREEN_TOPIC_DETAILS, SCREEN_VOCAB_STUDY_HUB

class HandwritingController:
    """
    Controller that connects the Handwriting Screen view with the model and recognition engine.
    """
    def __init__(self, screen: HandwritingScreen, model: AppModel, frame):
        self.screen = screen
        self.model = model
        self.frame = frame
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        templates_dir = os.path.join(base_dir, "assets", "templates")
        
        self.recognizer = TemplateRecognizer(templates_dir)
        
        self.category: str = "hiragana"
        self.characters: List[str] = []
        self.char_romaji: Dict[str, str] = {}
        self.current_index: int = 0
        
        self.screen.on_back_callback = self._on_back
        self.screen.on_clear_callback = self._on_clear
        self.screen.on_check_callback = self._on_check
        self.screen.on_char_select_callback = self._on_char_select
        self.screen.on_next_callback = self._on_next

    def set_practice_category(self, category: str):
        """Sets the active category (hiragana or katakana) and loads character list."""
        self.category = category
        self.screen.set_category(category)
        
        from data.kana_data import get_hiragana_basic, get_katakana_basic
        packages = get_hiragana_basic() if category == "hiragana" else get_katakana_basic()
        
        self.characters = []
        self.char_romaji = {}
        
        for pkg in packages:
            for entry in pkg.entries:
                self.characters.append(entry.kana)
                self.char_romaji[entry.kana] = entry.romaji
                
        self.screen.populate_characters(self.characters, self.char_romaji)
        
        self.current_index = 0
        if self.characters:
            self._load_character(self.characters[0])

    def set_vocab_pack(self, pack_id: str, selected_words: Optional[List[WordEntry]] = None):
        """Sets the active category to 'vocab' and loads vocabulary words from the pack."""
        from data.word_data import WordEntry
        self.category = "vocab"
        self.screen.set_category("vocab")

        pack = self.model.get_vocab_pack(pack_id)
        self.characters = []
        self.char_romaji = {}
        char_meanings = {}

        source_words = selected_words if selected_words is not None else (pack.words if pack else [])

        for w in source_words:
            word_key = w.word
            if not any(0x4E00 <= ord(ch) <= 0x9FFF for ch in word_key):
                continue
            if any(p in word_key for p in ('。', '.', '？', '?', 'です', 'ます', 'ください', 'はじめまして', 'よろしく', 'こちらへ')):
                continue
            if len(word_key) > 6:
                continue

            self.characters.append(word_key)
            self.char_romaji[word_key] = w.romaji
            char_meanings[word_key] = w.meaning

        self.screen.populate_characters(self.characters, self.char_romaji, char_meanings)

        self.current_index = 0
        if self.characters:
            self._load_character(self.characters[0])

    def _load_character(self, char: str):
        """Instructs the view to render the target practice character."""
        self.screen.setup_practice_character(char)

    def _on_back(self):
        """Returns the user back to the correct screen."""
        if self.category == "vocab":
            self.frame.show_screen(SCREEN_VOCAB_STUDY_HUB)
        else:
            self.frame.show_screen(SCREEN_TOPIC_DETAILS)

    def _on_clear(self):
        """Handled by view internally, reset controller state if necessary."""
        pass

    def _on_check(self, images):
        """Processes and evaluates the user drawing(s) from each character block canvas."""
        if not isinstance(images, list):
            images = [images]

        expected_word = self.characters[self.current_index]
        target_chars = [c for c in expected_word if c not in (" ", "　")]
        if not target_chars:
            target_chars = [expected_word]

        char_results = []
        scores = []
        detected_chars = []

        for idx, img in enumerate(images):
            target_c = target_chars[min(idx, len(target_chars) - 1)]
            
            preprocessed = HandwritingProcessor.preprocess(img)
            
            result = self.recognizer.recognize(preprocessed, allowed_words=[target_c])
            score = float(result["score"])
            detected_char = result["best_character"]
            
            threshold = 0.35 if self.category == "vocab" else 0.40
            is_char_correct = (score >= threshold)
            
            scores.append(score)
            detected_chars.append(target_c if is_char_correct else (detected_char if detected_char != "?" else "?"))
            char_results.append({
                "expected": target_c,
                "detected": detected_char,
                "score": score,
                "is_correct": is_char_correct
            })

        avg_score = float(np.mean(scores)) if scores else 0.0
        overall_correct = all(cr["is_correct"] for cr in char_results)
        overall_detected = "".join(detected_chars)

        self.screen.display_results(expected_word, overall_detected, avg_score, overall_correct, char_results)

    def _on_char_select(self, char: str):
        """Loads a character selected from the sidebar list."""
        if char in self.characters:
            self.current_index = self.characters.index(char)
            self._load_character(char)

    def _on_next(self):
        """Selects and loads the next character sequentially."""
        if self.characters:
            self.current_index = (self.current_index + 1) % len(self.characters)
            self._load_character(self.characters[self.current_index])
