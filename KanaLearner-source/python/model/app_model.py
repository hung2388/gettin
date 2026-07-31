"""
Central application model.
"""
import random
import time
import os
from enum import Enum
from typing import List, Dict, Optional

from data.kana_data import KanaEntry, KanaPackage, \
    get_hiragana_basic, get_hiragana_extended, \
    get_katakana_basic, get_katakana_extended, \
    get_number_packages, int_to_japanese
from data.word_data import WordEntry, get_words_for_type, VocabPack


class KanaType(Enum):
    HIRAGANA = "hiragana"
    KATAKANA = "katakana"
    BOTH = "both"
    NUMBERS = "numbers"
    DAYS_WEEK = "days_week"
    DAYS_MONTH = "days_month"
    MONTHS = "months"
    YEARS = "years"
    BIRTH_YEAR = "birth_year"
    PACK_00 = "pack_00"
    PACK_01 = "pack_01"
    PACK_02 = "pack_02"
    PACK_03 = "pack_03"


# LearningMode has been replaced with manual learning packs path


class SessionPart(Enum):
    PART1_KANA_ROMAJI = "part1"
    PART2_SPEED_TYPING = "part2"



class AppModel:

    PART2_TOTAL_ROUNDS = 10
    PART2_WORDS_PER_ROUND = 40

    def __init__(self):
        # ── Configuration ─────────────────────────────────────────────────
        self.kana_type: KanaType = KanaType.HIRAGANA
        self.selected_packages: List[KanaPackage] = []

        # ── Progress Tracking ─────────────────────────────────────────────
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.progress_file = os.path.join(base_dir, "user_progress.json")
        self.custom_packs: List[VocabPack] = []
        self.custom_packs_file = os.path.join(base_dir, "custom_packs.json")
        self.load_custom_packs()
        self.progress: Dict[str, float] = {}
        self.load_progress()

        # ── Session ───────────────────────────────────────────────────────
        self.current_stage_index: int = 0
        self.current_part: SessionPart = SessionPart.PART1_KANA_ROMAJI

        # Part 1 — word-based
        self.part1_questions: List[WordEntry] = []
        self.part1_question_index: int = 0
        self.part1_correct: int = 0
        self.part1_mistakes: int = 0
        self.part1_missed: List[WordEntry] = []

        # Part 2 — kana-based
        self.part2_sequence: List[KanaEntry] = []
        self.part2_index: int = 0
        self.part2_correct: int = 0
        self.part2_mistakes: int = 0
        self.part2_start_time: float = 0.0

        self.part2_current_round: int = 1

    def load_custom_packs(self):
        import json
        self.custom_packs = []
        if os.path.exists(self.custom_packs_file):
            try:
                with open(self.custom_packs_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        words = [
                            WordEntry(
                                word=w["word"],
                                romaji=w["romaji"],
                                meaning=w["meaning"],
                                kana=w.get("kana", "")
                            )
                            for w in item.get("words", [])
                        ]
                        self.custom_packs.append(
                            VocabPack(
                                id=item["id"],
                                name=item["name"],
                                description=item.get("description", ""),
                                words=words,
                                is_custom=True
                            )
                        )
            except Exception as e:
                print(f"Error loading custom packs: {e}")

    def save_custom_packs(self):
        import json
        data = [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "words": [
                    {
                        "word": w.word,
                        "romaji": w.romaji,
                        "meaning": w.meaning,
                        "kana": w.kana
                    }
                    for w in p.words
                ]
            }
            for p in self.custom_packs
        ]
        with open(self.custom_packs_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def create_custom_pack(self, name: str, description: str, words: List[WordEntry]) -> VocabPack:
        import uuid
        pack_id = f"custom_{uuid.uuid4().hex[:8]}"
        pack = VocabPack(id=pack_id, name=name, description=description, words=words, is_custom=True)
        self.custom_packs.append(pack)
        self.progress[pack_id] = 0.0
        self.save_custom_packs()
        self.save_progress()
        return pack

    def update_custom_pack(self, pack_id: str, name: str, description: str, words: List[WordEntry]):
        for pack in self.custom_packs:
            if pack.id == pack_id:
                # Update attributes
                object.__setattr__(pack, "name", name)
                object.__setattr__(pack, "description", description)
                object.__setattr__(pack, "words", words)
                break
        self.save_custom_packs()

    def delete_custom_pack(self, pack_id: str):
        self.custom_packs = [p for p in self.custom_packs if p.id != pack_id]
        if pack_id in self.progress:
            del self.progress[pack_id]
        self.save_custom_packs()
        self.save_progress()

    BUILT_IN_PACK_IDS = [
        "pack_00", "pack_01", "pack_02", "pack_03",
        "days_week", "days_month", "days_month_special", 
        "months", "years", "birth_year"
    ]

    HANDWRITING_PACK_IDS = ["pack_00", "pack_01", "pack_02", "pack_03"]

    def is_built_in_pack(self, pack_id: str) -> bool:
        """Returns True if the given pack_id corresponds to a built-in learning pack."""
        return pack_id in self.BUILT_IN_PACK_IDS

    def supports_handwriting_practice(self, pack_id: str) -> bool:
        """Returns True if the given pack_id supports Section 2 Kanji handwriting practice."""
        return pack_id in self.HANDWRITING_PACK_IDS

    def get_vocab_pack(self, pack_id: str) -> Optional[VocabPack]:
        # Built-in packs
        built_ins = {
            "pack_00": ("Gói từ vựng 00", "Tổng hợp Số, Thứ, Ngày, Tháng, Năm và Năm sinh"),
            "pack_01": ("Gói từ vựng 01", "Gói học từ vựng bài 1 tổng hợp"),
            "pack_02": ("Gói từ vựng 02", "Gói học từ vựng bài 2: Mua sắm, Nhà hàng & Địa điểm"),
            "pack_03": ("Gói từ vựng 03", "Gói học từ vựng bài 3: Thời gian, Địa điểm & Hoạt động hàng ngày"),
            "days_week": ("Thứ trong tuần", "Học cách đọc thứ trong tuần"),
            "days_month": ("Ngày trong tháng", "Học cách đọc ngày trong tháng"),
            "months": ("Tháng", "Học cách đọc các tháng trong năm"),
            "years": ("Năm", "Học cách đọc các năm"),
            "birth_year": ("Năm sinh", "Học cách giới thiệu năm sinh")
        }
        if pack_id in built_ins:
            name, desc = built_ins[pack_id]
            words = get_words_for_type(KanaType(pack_id))
            return VocabPack(id=pack_id, name=name, description=desc, words=words, is_custom=False)
            
        if pack_id == "days_month_special":
            words = get_words_for_type(KanaType.DAYS_MONTH)
            special_set = {"1日", "2日", "3日", "4日", "5日", "6日", "7日", "8日", "9日", "10日", "14日", "20日", "24日"}
            filtered = [w for w in words if w.word in special_set]
            return VocabPack(
                id="days_month_special",
                name="Ngày đặc biệt (1-10, 14, 20, 24)",
                description="Học các ngày trong tháng đặc biệt",
                words=filtered,
                is_custom=False
            )
            
        # Custom packs
        for p in self.custom_packs:
            if p.id == pack_id:
                return p
                
        # Review pack
        if pack_id == "review_all":
            all_words = []
            # Gather from built-in
            for k in built_ins.keys():
                all_words.extend(get_words_for_type(KanaType(k)))
            # Gather from custom
            for p in self.custom_packs:
                all_words.extend(p.words)
            # Remove duplicates
            seen = set()
            unique_words = []
            for w in all_words:
                key = (w.word, w.get_kana())
                if key not in seen:
                    seen.add(key)
                    unique_words.append(w)
            return VocabPack(
                id="review_all",
                name="Review All",
                description="Tổng hợp tất cả từ vựng của các chủ đề",
                words=unique_words,
                is_custom=False
            )
        return None

    def get_all_vocab_packs(self) -> List[VocabPack]:
        packs = []
        # Built-in
        for kid in self.BUILT_IN_PACK_IDS:
            p = self.get_vocab_pack(kid)
            if p:
                packs.append(p)
        # Custom
        packs.extend(self.custom_packs)
        # Review
        rp = self.get_vocab_pack("review_all")
        if rp:
            packs.append(rp)
        return packs

    def load_progress(self):
        import json
        self.progress = {
            "hiragana": 0.0,
            "katakana": 0.0,
            "numbers": 0.0,
            "pack_00": 0.0,
            "pack_01": 0.0,
            "pack_02": 0.0,
            "pack_03": 0.0,
            "days_week": 0.0,
            "days_month": 0.0,
            "days_month_special": 0.0,
            "months": 0.0,
            "years": 0.0,
            "birth_year": 0.0
        }
        for pack in self.custom_packs:
            self.progress[pack.id] = 0.0

        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k, v in data.items():
                        self.progress[k] = float(v)
            except Exception as e:
                print("Error loading progress:", e)

    def save_progress(self):
        import json
        try:
            with open(self.progress_file, "w", encoding="utf-8") as f:
                json.dump(self.progress, f, indent=4)
        except Exception as e:
            print("Error saving progress:", e)

    def get_topic_status(self, topic: str) -> str:
        progress = self.progress.get(topic, 0.0)
        if progress >= 100.0:
            return "completed"
        if progress > 0.0:
            return "in_progress"
        return "available"




    def get_all_available_packages(self) -> List[KanaPackage]:
        result: List[KanaPackage] = []
        if self.kana_type in (KanaType.HIRAGANA, KanaType.BOTH):
            result.extend(get_hiragana_basic())
            result.extend(get_hiragana_extended())
        if self.kana_type in (KanaType.KATAKANA, KanaType.BOTH):
            result.extend(get_katakana_basic())
            result.extend(get_katakana_extended())
        if self.kana_type == KanaType.NUMBERS:
            result.extend(get_number_packages())
        return result

    # ── Session Lifecycle ─────────────────────────────────────────────────

    def start_new_stage(self):
        self.current_part = SessionPart.PART1_KANA_ROMAJI
        self.part1_missed.clear()
        self.part1_correct = 0
        self.part1_mistakes = 0
        self.part1_question_index = 0
        self.part1_questions = self._generate_part1_questions(20)

        self.part2_correct = 0
        self.part2_mistakes = 0
        self.part2_index = 0
        self.part2_sequence = []

    def start_part2(self):
        self.current_part = SessionPart.PART2_SPEED_TYPING
        self.part2_correct = 0
        self.part2_mistakes = 0
        self.part2_current_round = 1
        self.part2_start_time = time.time()
        self.load_part2_round()

    def load_part2_round(self):
        self.part2_index = 0
        self.part2_sequence = self._generate_part2_sequence(self.selected_packages, self.PART2_WORDS_PER_ROUND)

    def has_next_part2_round(self) -> bool:
        return self.part2_current_round < self.PART2_TOTAL_ROUNDS

    def advance_part2_round(self):
        self.part2_current_round += 1
        self.load_part2_round()

    def advance_to_next_stage(self):
        self.current_stage_index += 1
        self.start_new_stage()

    # ── Part 1 helpers ────────────────────────────────────────────────────

    def get_current_part1_question(self) -> Optional[WordEntry]:
        if self.part1_question_index < len(self.part1_questions):
            return self.part1_questions[self.part1_question_index]
        return None

    def submit_part1_answer(self, answer: str) -> bool:
        q = self.get_current_part1_question()
        if q is None:
            return False
        correct = q.romaji.lower() == answer.strip().lower()
        if correct:
            self.part1_correct += 1
            self.part1_question_index += 1
        else:
            self.part1_mistakes += 1
            self.part1_missed.append(q)
        return correct

    def advance_part1_after_wrong(self):
        self.part1_question_index += 1

    def is_part1_complete(self) -> bool:
        return self.part1_question_index >= len(self.part1_questions)

    # ── Part 2 helpers ────────────────────────────────────────────────────

    def get_current_part2_item(self) -> Optional[KanaEntry]:
        if self.part2_index < len(self.part2_sequence):
            return self.part2_sequence[self.part2_index]
        return None

    def submit_part2_word(self, word: str) -> bool:
        item = self.get_current_part2_item()
        if item is None:
            return False
        correct = item.romaji.lower() == word.strip().lower()
        if correct:
            self.part2_correct += 1
            self.part2_index += 1
        else:
            self.part2_mistakes += 1
        return correct

    def is_part2_complete(self) -> bool:
        return self.part2_index >= len(self.part2_sequence)

    def get_part2_elapsed_seconds(self) -> int:
        return int(time.time() - self.part2_start_time)

    def get_part2_total_items(self) -> int:
        return self.PART2_WORDS_PER_ROUND * self.PART2_TOTAL_ROUNDS

    # ── Generation ────────────────────────────────────────────────────────

    def _generate_part1_questions(self, count: int) -> List[WordEntry]:
        if self.kana_type == KanaType.NUMBERS:
            result: List[WordEntry] = []
            digit_options = [1, 2, 3, 4, 5]
            for _ in range(count):
                d = random.choice(digit_options)
                if d == 1:
                    val = random.randint(1, 9)
                elif d == 2:
                    val = random.randint(10, 99)
                elif d == 3:
                    val = random.randint(100, 999)
                elif d == 4:
                    val = random.randint(1000, 9999)
                else:
                    val = random.randint(10000, 99999)
                _, r = int_to_japanese(val)
                result.append(WordEntry(word=str(val), romaji=r, meaning=""))
            return result

        pool = list(get_words_for_type(self.kana_type))
        if not pool:
            return []
        random.shuffle(pool)

        result: List[WordEntry] = []
        i = 0
        while len(result) < count:
            result.append(pool[i % len(pool)])
            i += 1
            if i % len(pool) == 0:
                random.shuffle(pool)
        return result

    def _generate_part2_sequence(self, pkgs: List[KanaPackage], count: int) -> List[KanaEntry]:
        if self.kana_type == KanaType.NUMBERS:
            result: List[KanaEntry] = []
            digit_options = [1, 2, 3, 4, 5]
            for _ in range(count):
                d = random.choice(digit_options)
                if d == 1:
                    val = random.randint(1, 9)
                elif d == 2:
                    val = random.randint(10, 99)
                elif d == 3:
                    val = random.randint(100, 999)
                elif d == 4:
                    val = random.randint(1000, 9999)
                else:
                    val = random.randint(10000, 99999)
                _, r = int_to_japanese(val)
                result.append(KanaEntry(kana=str(val), romaji=r, hint=""))
            return result

        pool = self._flatten_packages(pkgs)
        if not pool:
            return []

        random.shuffle(pool)
        result: List[KanaEntry] = []
        for i in range(count):
            result.append(pool[i % len(pool)])
        return result

    @staticmethod
    def _flatten_packages(pkgs: List[KanaPackage]) -> List[KanaEntry]:
        result: List[KanaEntry] = []
        for p in pkgs:
            result.extend(p.entries)
        return result
