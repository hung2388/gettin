"""
bridge.py — Python API exposed to the JavaScript frontend via pywebview.

All public methods are accessible from JavaScript as:
    window.pywebview.api.method_name(args)
"""
import json
import random
import subprocess
import threading
import time
import os
from typing import List, Optional

from model.app_model import AppModel, KanaType, SessionPart
from data.word_data import WordEntry, VocabPack
from data.kana_data import get_hiragana_basic, get_hiragana_extended, get_katakana_basic, get_katakana_extended


def _speak_async(text: str):
    """Speak Japanese text using Windows TTS in background thread."""
    safe_text = "".join(c for c in text if c.isalnum() or c in " 。、！？.!?")

    def _run():
        ps_code = f"""
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {{ $synth.SelectVoice('Microsoft Haruka Desktop') }} catch {{}}
$synth.Speak('{safe_text}')
"""
        subprocess.run(["powershell", "-Command", ps_code], capture_output=True)

    threading.Thread(target=_run, daemon=True).start()


class Api:
    """
    Bridge object exposed to JavaScript via pywebview.
    Every public method returns JSON-serializable data.
    """

    def __init__(self, model: AppModel):
        self.model = model

        # ── Active study session state ────────────────────────────────────
        self._session_pack_id: str = ""
        self._session_words: List[WordEntry] = []
        self._session_selected_indices: set = set()

        # Level 1 — Multiple Choice
        self._l1_pool: List[WordEntry] = []
        self._l1_queue: List[WordEntry] = []
        self._l1_failed: List[WordEntry] = []
        self._l1_index: int = 0
        self._l1_correct: int = 0
        self._l1_mistakes: int = 0
        self._l1_original_count: int = 0

        # Level 2 — Active Recall (type kana)
        self._l2_pool: List[WordEntry] = []
        self._l2_queue: List[WordEntry] = []
        self._l2_failed: List[WordEntry] = []
        self._l2_index: int = 0
        self._l2_correct: int = 0
        self._l2_mistakes: int = 0

        # Level 3 — Listening Dictation
        self._l3_pool: List[WordEntry] = []
        self._l3_blocks: List[List[dict]] = []
        self._l3_block_idx: int = 0
        self._l3_correct: int = 0
        self._l3_total_tested: int = 0

        # Level 4 — Word Matching (Triplet)
        self._l4_pool: List[WordEntry] = []
        self._l4_remaining: List[WordEntry] = []
        self._l4_matched: int = 0

        # Level 5 — Speed Typing
        self._l5_sequence: List[dict] = []
        self._l5_index: int = 0
        self._l5_correct: int = 0
        self._l5_wrong: int = 0
        self._l5_start: float = 0.0

        # Flashcard
        self._fc_index: int = 0

    # ── Utility ──────────────────────────────────────────────────────────

    def _words_to_dicts(self, words: List[WordEntry]) -> List[dict]:
        return [
            {"word": w.word, "romaji": w.romaji, "meaning": w.meaning, "kana": w.kana if w.kana else ""}
            for w in words
        ]

    # ═══════════════════════════════════════════════════════════════════════
    # PROGRESS & ROADMAP
    # ═══════════════════════════════════════════════════════════════════════

    def get_progress(self) -> str:
        return json.dumps(self.model.progress)

    def get_roadmap(self) -> str:
        nodes = [
            {"key": "hiragana",  "name": "Hiragana",      "icon": "平",  "subtitle": "46 characters"},
            {"key": "katakana",  "name": "Katakana",       "icon": "カ",  "subtitle": "46 characters"},
            {"key": "pack_00",   "name": "Numbers & Dates","icon": "数",  "subtitle": "Numbers, days, months"},
            {"key": "pack_01",   "name": "Vocabulary I",   "icon": "言",  "subtitle": "Lesson 1 vocabulary"},
            {"key": "pack_02",   "name": "Vocabulary II",  "icon": "語",  "subtitle": "Shopping & places"},
            {"key": "pack_03",   "name": "Vocabulary III", "icon": "話",  "subtitle": "Time & daily activities"},
        ]
        for node in nodes:
            node["progress"] = self.model.progress.get(node["key"], 0.0)
            node["status"] = self.model.get_topic_status(node["key"])
        return json.dumps(nodes)

    def set_progress(self, topic: str, value: float) -> str:
        self.model.progress[topic] = float(value)
        self.model.save_progress()
        return json.dumps({"ok": True})

    # ═══════════════════════════════════════════════════════════════════════
    # VOCABULARY PACKS
    # ═══════════════════════════════════════════════════════════════════════

    def get_all_packs(self) -> str:
        packs = self.model.get_all_vocab_packs()
        result = []
        for p in packs:
            result.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "word_count": len(p.words),
                "is_custom": p.is_custom,
                "progress": self.model.progress.get(p.id, 0.0),
                "supports_handwriting": self.model.supports_handwriting_practice(p.id),
            })
        return json.dumps(result)

    def get_pack_words(self, pack_id: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps([])
        return json.dumps(self._words_to_dicts(pack.words))

    def get_pack_info(self, pack_id: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps(None)
        return json.dumps({
            "id": pack.id,
            "name": pack.name,
            "description": pack.description,
            "word_count": len(pack.words),
            "is_custom": pack.is_custom,
            "progress": self.model.progress.get(pack.id, 0.0),
            "supports_handwriting": self.model.supports_handwriting_practice(pack.id),
        })

    def create_custom_pack(self, name: str, description: str, words_json: str) -> str:
        words_data = json.loads(words_json)
        words = [WordEntry(w["word"], w["romaji"], w["meaning"], w.get("kana", "")) for w in words_data]
        pack = self.model.create_custom_pack(name, description, words)
        return json.dumps({"id": pack.id, "name": pack.name})

    def update_custom_pack(self, pack_id: str, name: str, description: str, words_json: str) -> str:
        words_data = json.loads(words_json)
        words = [WordEntry(w["word"], w["romaji"], w["meaning"], w.get("kana", "")) for w in words_data]
        self.model.update_custom_pack(pack_id, name, description, words)
        return json.dumps({"ok": True})

    def delete_custom_pack(self, pack_id: str) -> str:
        self.model.delete_custom_pack(pack_id)
        return json.dumps({"ok": True})

    # ═══════════════════════════════════════════════════════════════════════
    # SESSION SETUP
    # ═══════════════════════════════════════════════════════════════════════

    def init_session(self, pack_id: str, selected_indices_json: str) -> str:
        """Initialize the study session for a pack with optional word selection."""
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps({"ok": False, "error": "Pack not found"})

        self._session_pack_id = pack_id
        self._session_words = list(pack.words)

        indices = json.loads(selected_indices_json)
        if indices:
            self._session_selected_indices = set(indices)
        else:
            self._session_selected_indices = set(range(len(self._session_words)))

        return json.dumps({"ok": True, "word_count": len(self._session_selected_indices)})

    def get_session_words(self) -> str:
        selected = [w for i, w in enumerate(self._session_words) if i in self._session_selected_indices]
        return json.dumps(self._words_to_dicts(selected))

    # ═══════════════════════════════════════════════════════════════════════
    # TTS
    # ═══════════════════════════════════════════════════════════════════════

    def speak(self, text: str) -> str:
        _speak_async(text)
        return json.dumps({"ok": True})

    # ═══════════════════════════════════════════════════════════════════════
    # LEVEL 1 — Multiple Choice
    # ═══════════════════════════════════════════════════════════════════════

    def level1_start(self, pack_id: str, selected_indices_json: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps({"ok": False})

        indices = json.loads(selected_indices_json)
        if indices:
            pool = [pack.words[i] for i in indices if i < len(pack.words)]
        else:
            pool = list(pack.words)

        self._l1_pool = pool
        self._l1_queue = list(pool)
        random.shuffle(self._l1_queue)
        self._l1_failed = []
        self._l1_index = 0
        self._l1_correct = 0
        self._l1_mistakes = 0
        self._l1_original_count = len(pool)
        return json.dumps({"ok": True, "total": self._l1_original_count})

    def level1_get_question(self) -> str:
        if self._l1_index >= len(self._l1_queue):
            if self._l1_failed:
                self._l1_queue = list(self._l1_failed)
                random.shuffle(self._l1_queue)
                self._l1_failed = []
                self._l1_index = 0
            else:
                return json.dumps({"done": True, "correct": self._l1_correct, "mistakes": self._l1_mistakes, "total": self._l1_original_count})

        word = self._l1_queue[self._l1_index]
        # Generate 3 wrong choices for meaning
        all_meanings = [w.meaning for w in self._l1_pool if w.meaning != word.meaning]
        random.shuffle(all_meanings)
        wrongs = all_meanings[:3]
        choices = wrongs + [word.meaning]
        random.shuffle(choices)

        return json.dumps({
            "done": False,
            "word": word.word,
            "kana": word.kana if word.kana else "",
            "romaji": word.romaji,
            "correct_meaning": word.meaning,
            "choices": choices,
            "progress": self._l1_index,
            "total": len(self._l1_queue),
            "correct_count": self._l1_correct,
            "mistakes": self._l1_mistakes,
        })

    def level1_answer(self, chosen_meaning: str) -> str:
        if self._l1_index >= len(self._l1_queue):
            return json.dumps({"error": "No active question"})
        word = self._l1_queue[self._l1_index]
        correct = chosen_meaning.strip() == word.meaning.strip()
        if correct:
            self._l1_correct += 1
        else:
            self._l1_mistakes += 1
            self._l1_failed.append(word)
        self._l1_index += 1
        return json.dumps({"correct": correct, "correct_meaning": word.meaning, "romaji": word.romaji})

    # ═══════════════════════════════════════════════════════════════════════
    # LEVEL 2 — Active Recall (type the Japanese word)
    # ═══════════════════════════════════════════════════════════════════════

    def level2_start(self, pack_id: str, selected_indices_json: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps({"ok": False})

        indices = json.loads(selected_indices_json)
        if indices:
            pool = [pack.words[i] for i in indices if i < len(pack.words)]
        else:
            pool = list(pack.words)

        self._l2_pool = pool
        self._l2_queue = list(pool)
        random.shuffle(self._l2_queue)
        self._l2_failed = []
        self._l2_index = 0
        self._l2_correct = 0
        self._l2_mistakes = 0
        return json.dumps({"ok": True, "total": len(pool)})

    def level2_get_question(self) -> str:
        if self._l2_index >= len(self._l2_queue):
            if self._l2_failed:
                self._l2_queue = list(self._l2_failed)
                random.shuffle(self._l2_queue)
                self._l2_failed = []
                self._l2_index = 0
            else:
                return json.dumps({"done": True, "correct": self._l2_correct, "mistakes": self._l2_mistakes})

        word = self._l2_queue[self._l2_index]
        return json.dumps({
            "done": False,
            "meaning": word.meaning,
            "romaji_hint": word.romaji,
            "correct_word": word.word,
            "correct_kana": word.kana if word.kana else "",
            "progress": self._l2_index,
            "total": len(self._l2_queue),
            "correct_count": self._l2_correct,
            "mistakes": self._l2_mistakes,
        })

    def level2_answer(self, typed: str) -> str:
        if self._l2_index >= len(self._l2_queue):
            return json.dumps({"error": "No active question"})
        word = self._l2_queue[self._l2_index]
        typed_clean = typed.strip()
        correct = typed_clean == word.word or typed_clean == (word.kana if word.kana else "")
        if correct:
            self._l2_correct += 1
        else:
            self._l2_mistakes += 1
            self._l2_failed.append(word)
        self._l2_index += 1
        return json.dumps({"correct": correct, "correct_word": word.word, "kana": word.kana or "", "romaji": word.romaji})

    # ═══════════════════════════════════════════════════════════════════════
    # LEVEL 3 — Listening Dictation
    # ═══════════════════════════════════════════════════════════════════════

    WORDS_PER_BLOCK = 10

    def level3_start(self, pack_id: str, selected_indices_json: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps({"ok": False})

        indices = json.loads(selected_indices_json)
        if indices:
            pool = [pack.words[i] for i in indices if i < len(pack.words)]
        else:
            pool = list(pack.words)

        random.shuffle(pool)
        self._l3_pool = pool
        self._l3_correct = 0
        self._l3_total_tested = 0

        # Build blocks
        blocks = []
        for i in range(0, len(pool), self.WORDS_PER_BLOCK):
            chunk = pool[i:i + self.WORDS_PER_BLOCK]
            blocks.append(self._words_to_dicts(chunk))
        self._l3_blocks = blocks
        self._l3_block_idx = 0

        return json.dumps({"ok": True, "total_blocks": len(blocks), "total_words": len(pool)})

    def level3_get_block(self) -> str:
        if self._l3_block_idx >= len(self._l3_blocks):
            return json.dumps({"done": True, "correct": self._l3_correct, "total": self._l3_total_tested})
        block = self._l3_blocks[self._l3_block_idx]
        return json.dumps({
            "done": False,
            "block": block,
            "block_index": self._l3_block_idx,
            "total_blocks": len(self._l3_blocks),
        })

    def level3_speak_block(self) -> str:
        """Speak all words in current block sequentially."""
        if self._l3_block_idx >= len(self._l3_blocks):
            return json.dumps({"ok": False})
        block = self._l3_blocks[self._l3_block_idx]

        def _speak_sequence():
            for w in block:
                _speak_async(w["word"])
                time.sleep(2.5)

        threading.Thread(target=_speak_sequence, daemon=True).start()
        return json.dumps({"ok": True})

    def level3_speak_word(self, word: str) -> str:
        _speak_async(word)
        return json.dumps({"ok": True})

    def level3_submit_block(self, answers_json: str) -> str:
        """answers_json: list of strings typed by user, one per word in block."""
        if self._l3_block_idx >= len(self._l3_blocks):
            return json.dumps({"error": "No active block"})

        answers = json.loads(answers_json)
        block = self._l3_blocks[self._l3_block_idx]

        results = []
        for i, word in enumerate(block):
            typed = answers[i].strip() if i < len(answers) else ""
            correct = (typed == word["word"] or
                       typed == word["kana"] or
                       typed.lower() == word["romaji"].lower())
            if correct:
                self._l3_correct += 1
            self._l3_total_tested += 1
            results.append({
                "correct": correct,
                "typed": typed,
                "word": word["word"],
                "kana": word["kana"],
                "romaji": word["romaji"],
                "meaning": word["meaning"],
            })

        self._l3_block_idx += 1
        more = self._l3_block_idx < len(self._l3_blocks)
        return json.dumps({
            "results": results,
            "more_blocks": more,
            "block_correct": sum(1 for r in results if r["correct"]),
            "block_total": len(block),
        })

    # ═══════════════════════════════════════════════════════════════════════
    # LEVEL 4 — Word Matching (Triplet: kanji + kana + meaning)
    # ═══════════════════════════════════════════════════════════════════════

    BATCH_SIZE = 6

    def level4_start(self, pack_id: str, selected_indices_json: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps({"ok": False})

        indices = json.loads(selected_indices_json)
        if indices:
            pool = [pack.words[i] for i in indices if i < len(pack.words)]
        else:
            pool = list(pack.words)

        self._l4_pool = pool
        self._l4_remaining = list(pool)
        random.shuffle(self._l4_remaining)
        self._l4_matched = 0
        return json.dumps({"ok": True, "total": len(pool)})

    def level4_get_batch(self) -> str:
        if not self._l4_remaining:
            return json.dumps({"done": True, "matched": self._l4_matched, "total": len(self._l4_pool)})

        batch = self._l4_remaining[:self.BATCH_SIZE]

        # Build shuffled card lists
        kanji_cards = [{"id": i, "text": w.word, "type": "kanji"} for i, w in enumerate(batch)]
        kana_cards  = [{"id": i, "text": w.kana if w.kana else w.word, "type": "kana"} for i, w in enumerate(batch)]
        meaning_cards = [{"id": i, "text": w.meaning, "type": "meaning"} for i, w in enumerate(batch)]

        random.shuffle(kanji_cards)
        random.shuffle(kana_cards)
        random.shuffle(meaning_cards)

        return json.dumps({
            "done": False,
            "batch_words": self._words_to_dicts(batch),
            "kanji_cards": kanji_cards,
            "kana_cards": kana_cards,
            "meaning_cards": meaning_cards,
            "batch_size": len(batch),
            "matched": self._l4_matched,
            "total": len(self._l4_pool),
        })

    def level4_submit_match(self, kanji_id: int, kana_id: int, meaning_id: int) -> str:
        """Check if three selected IDs correspond to the same word."""
        batch = self._l4_remaining[:self.BATCH_SIZE]
        correct = (kanji_id == kana_id == meaning_id and 0 <= kanji_id < len(batch))
        return json.dumps({"correct": correct})

    def level4_advance(self, matched_count: int) -> str:
        """Remove matched words from remaining pool."""
        removed = min(matched_count, len(self._l4_remaining))
        self._l4_remaining = self._l4_remaining[removed:]
        self._l4_matched += removed
        return json.dumps({"ok": True, "remaining": len(self._l4_remaining)})

    # ═══════════════════════════════════════════════════════════════════════
    # LEVEL 5 — Speed Typing
    # ═══════════════════════════════════════════════════════════════════════

    def level5_start(self, pack_id: str, selected_indices_json: str) -> str:
        pack = self.model.get_vocab_pack(pack_id)
        if not pack:
            return json.dumps({"ok": False})

        indices = json.loads(selected_indices_json)
        if indices:
            pool = [pack.words[i] for i in indices if i < len(pack.words)]
        else:
            pool = list(pack.words)

        random.shuffle(pool)
        self._l5_sequence = self._words_to_dicts(pool)
        self._l5_index = 0
        self._l5_correct = 0
        self._l5_wrong = 0
        self._l5_start = time.time()
        return json.dumps({"ok": True, "total": len(pool)})

    def level5_get_current(self) -> str:
        if self._l5_index >= len(self._l5_sequence):
            elapsed = int(time.time() - self._l5_start)
            return json.dumps({
                "done": True,
                "correct": self._l5_correct,
                "wrong": self._l5_wrong,
                "total": len(self._l5_sequence),
                "elapsed": elapsed,
            })
        word = self._l5_sequence[self._l5_index]
        return json.dumps({
            "done": False,
            "word": word["word"],
            "kana": word["kana"],
            "meaning": word["meaning"],
            "romaji": word["romaji"],
            "index": self._l5_index,
            "total": len(self._l5_sequence),
            "correct": self._l5_correct,
            "wrong": self._l5_wrong,
            "elapsed": int(time.time() - self._l5_start),
        })

    def level5_check_input(self, typed: str) -> str:
        """Check partial input - returns if complete and correct."""
        if self._l5_index >= len(self._l5_sequence):
            return json.dumps({"done": True})
        word = self._l5_sequence[self._l5_index]
        typed_clean = typed.strip().lower()
        romaji = word["romaji"].lower()
        # Auto-advance when length matches and content matches
        if len(typed_clean) >= len(romaji):
            correct = typed_clean == romaji
            if correct:
                self._l5_correct += 1
            else:
                self._l5_wrong += 1
            self._l5_index += 1
            return json.dumps({"advance": True, "correct": correct, "romaji": romaji})
        return json.dumps({"advance": False, "partial_ok": romaji.startswith(typed_clean)})

    def level5_get_elapsed(self) -> str:
        return json.dumps({"elapsed": int(time.time() - self._l5_start)})

    # ═══════════════════════════════════════════════════════════════════════
    # KANA SESSION (Part1 / Part2) — Hiragana/Katakana quiz
    # ═══════════════════════════════════════════════════════════════════════

    def kana_session_start(self, kana_type: str) -> str:
        self.model.kana_type = KanaType(kana_type)
        self.model.selected_packages = self.model.get_all_available_packages()
        self.model.start_new_stage()
        return json.dumps({"ok": True, "part": "part1", "total": len(self.model.part1_questions)})

    def kana_part1_get_question(self) -> str:
        q = self.model.get_current_part1_question()
        if q is None:
            return json.dumps({"done": True})
        return json.dumps({
            "done": False,
            "word": q.word,
            "romaji": q.romaji,
            "meaning": q.meaning if q.meaning else "",
            "index": self.model.part1_question_index + 1,
            "total": len(self.model.part1_questions),
            "correct": self.model.part1_correct,
            "mistakes": self.model.part1_mistakes,
        })

    def kana_part1_answer(self, answer: str) -> str:
        q = self.model.get_current_part1_question()
        if q is None:
            return json.dumps({"error": "No question"})
        if len(answer) < len(q.romaji):
            return json.dumps({"waiting": True})
        correct = self.model.submit_part1_answer(answer)
        if not correct:
            self.model.advance_part1_after_wrong()
        complete = self.model.is_part1_complete()
        return json.dumps({
            "correct": correct,
            "correct_romaji": q.romaji,
            "complete": complete,
            "correct_count": self.model.part1_correct,
            "mistakes": self.model.part1_mistakes,
        })

    def kana_part2_start(self) -> str:
        self.model.start_part2()
        return json.dumps({
            "ok": True,
            "total_rounds": self.model.PART2_TOTAL_ROUNDS,
            "words_per_round": self.model.PART2_WORDS_PER_ROUND,
        })

    def kana_part2_get_item(self) -> str:
        item = self.model.get_current_part2_item()
        if item is None:
            return json.dumps({"done": True})
        return json.dumps({
            "done": False,
            "kana": item.kana,
            "romaji": item.romaji,
            "index": self.model.part2_index,
            "round": self.model.part2_current_round,
            "total_rounds": self.model.PART2_TOTAL_ROUNDS,
            "correct": self.model.part2_correct,
            "mistakes": self.model.part2_mistakes,
            "elapsed": self.model.get_part2_elapsed_seconds(),
        })

    def kana_part2_answer(self, answer: str) -> str:
        item = self.model.get_current_part2_item()
        if item is None:
            return json.dumps({"error": "No item"})
        if len(answer) < len(item.romaji):
            return json.dumps({"waiting": True})
        correct = self.model.submit_part2_word(answer)
        complete = self.model.is_part2_complete()
        has_more_rounds = self.model.has_next_part2_round()
        if complete and has_more_rounds:
            self.model.advance_part2_round()
            complete = False
        return json.dumps({
            "correct": correct,
            "correct_romaji": item.romaji,
            "round_complete": complete and not has_more_rounds if complete else False,
            "complete": complete and not has_more_rounds,
            "round": self.model.part2_current_round,
        })

    def kana_finish(self) -> str:
        """Mark kana topic as completed and save progress."""
        topic = self.model.kana_type.value
        self.model.progress[topic] = 100.0
        self.model.save_progress()
        p1_correct = self.model.part1_correct
        p1_total = len(self.model.part1_questions)
        p2_correct = self.model.part2_correct
        p2_total = self.model.get_part2_total_items()
        elapsed = self.model.get_part2_elapsed_seconds()
        return json.dumps({
            "ok": True,
            "topic": topic,
            "p1_correct": p1_correct, "p1_total": p1_total,
            "p2_correct": p2_correct, "p2_total": p2_total,
            "elapsed": elapsed,
        })

    def mark_pack_complete(self, pack_id: str) -> str:
        self.model.progress[pack_id] = 100.0
        self.model.save_progress()
        return json.dumps({"ok": True})

    def update_pack_progress(self, pack_id: str, value: float) -> str:
        self.model.progress[pack_id] = max(0.0, min(100.0, float(value)))
        self.model.save_progress()
        return json.dumps({"ok": True})
