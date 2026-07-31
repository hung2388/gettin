import os
import json
import numpy as np
import cv2
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from .handwriting_processor import HandwritingProcessor

class Recognizer(ABC):
    """
    Abstract base class for handwriting recognizers.
    Allows replacing template matching with deep learning (e.g. CNN) later.
    """
    @abstractmethod
    def recognize(self, image: np.ndarray, category: Optional[str] = None, allowed_words: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Recognize a handwritten character or word from a preprocessed 128x128 numpy array.
        Returns:
            {"best_character": str, "score": float}
        """
        pass

def parse_kanjivg_svg_path(d_str: str, target_size: float = 1024.0, orig_size: float = 109.0) -> List[List[int]]:
    """
    Parses a KanjiVG SVG path 'd' string into a list of [x, y] point coordinates scaled to target_size.
    """
    import re
    scale = target_size / orig_size
    tokens = re.findall(r'([a-zA-Z])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', d_str)
    
    cmd = None
    curr_x, curr_y = 0.0, 0.0
    last_cp_x, last_cp_y = 0.0, 0.0
    points = []
    
    idx = 0
    num_tokens = len(tokens)
    
    def get_num() -> Optional[float]:
        nonlocal idx
        while idx < num_tokens:
            c, n = tokens[idx]
            idx += 1
            if n:
                return float(n)
        return None

    while idx < num_tokens:
        c, n = tokens[idx]
        if c:
            cmd = c
            idx += 1
        
        if cmd in ('M', 'm'):
            is_rel = (cmd == 'm')
            x, y = get_num(), get_num()
            if x is None or y is None:
                break
            curr_x = (curr_x + x) if is_rel else x
            curr_y = (curr_y + y) if is_rel else y
            last_cp_x, last_cp_y = curr_x, curr_y
            points.append([int(round(curr_x * scale)), int(round(curr_y * scale))])
            cmd = 'l' if is_rel else 'L'

        elif cmd in ('L', 'l'):
            is_rel = (cmd == 'l')
            x, y = get_num(), get_num()
            if x is None or y is None:
                break
            curr_x = (curr_x + x) if is_rel else x
            curr_y = (curr_y + y) if is_rel else y
            last_cp_x, last_cp_y = curr_x, curr_y
            points.append([int(round(curr_x * scale)), int(round(curr_y * scale))])

        elif cmd in ('H', 'h'):
            is_rel = (cmd == 'h')
            x = get_num()
            if x is None:
                break
            curr_x = (curr_x + x) if is_rel else x
            last_cp_x, last_cp_y = curr_x, curr_y
            points.append([int(round(curr_x * scale)), int(round(curr_y * scale))])

        elif cmd in ('V', 'v'):
            is_rel = (cmd == 'v')
            y = get_num()
            if y is None:
                break
            curr_y = (curr_y + y) if is_rel else y
            last_cp_x, last_cp_y = curr_x, curr_y
            points.append([int(round(curr_x * scale)), int(round(curr_y * scale))])

        elif cmd in ('C', 'c'):
            is_rel = (cmd == 'c')
            dx1, dy1 = get_num(), get_num()
            dx2, dy2 = get_num(), get_num()
            dx3, dy3 = get_num(), get_num()
            if dx3 is None or dy3 is None:
                break
            
            x1 = (curr_x + dx1) if is_rel else dx1
            y1 = (curr_y + dy1) if is_rel else dy1
            x2 = (curr_x + dx2) if is_rel else dx2
            y2 = (curr_y + dy2) if is_rel else dy2
            x3 = (curr_x + dx3) if is_rel else dx3
            y3 = (curr_y + dy3) if is_rel else dy3
            
            for step in range(1, 6):
                t = step / 5.0
                bx = (1-t)**3 * curr_x + 3*(1-t)**2 * t * x1 + 3*(1-t) * t**2 * x2 + t**3 * x3
                by = (1-t)**3 * curr_y + 3*(1-t)**2 * t * y1 + 3*(1-t) * t**2 * y2 + t**3 * y3
                points.append([int(round(bx * scale)), int(round(by * scale))])
            
            last_cp_x, last_cp_y = x2, y2
            curr_x, curr_y = x3, y3

        elif cmd in ('S', 's'):
            is_rel = (cmd == 's')
            dx2, dy2 = get_num(), get_num()
            dx3, dy3 = get_num(), get_num()
            if dx3 is None or dy3 is None:
                break
            
            x1 = 2 * curr_x - last_cp_x
            y1 = 2 * curr_y - last_cp_y
            x2 = (curr_x + dx2) if is_rel else dx2
            y2 = (curr_y + dy2) if is_rel else dy2
            x3 = (curr_x + dx3) if is_rel else dx3
            y3 = (curr_y + dy3) if is_rel else dy3
            
            for step in range(1, 6):
                t = step / 5.0
                bx = (1-t)**3 * curr_x + 3*(1-t)**2 * t * x1 + 3*(1-t) * t**2 * x2 + t**3 * x3
                by = (1-t)**3 * curr_y + 3*(1-t)**2 * t * y1 + 3*(1-t) * t**2 * y2 + t**3 * y3
                points.append([int(round(bx * scale)), int(round(by * scale))])
            
            last_cp_x, last_cp_y = x2, y2
            curr_x, curr_y = x3, y3
        else:
            break
            
    return points


class TemplateRecognizer(Recognizer):
    """
    Shape recognizer using template matching via blurred cosine similarity.
    """
    def __init__(self, templates_dir: str):
        self.templates_dir = templates_dir
        self.templates: Dict[str, np.ndarray] = {}
        self.word_templates: Dict[str, np.ndarray] = {}
        self.hiragana_chars = set()
        self.katakana_chars = set()
        self._load_templates()

    def _load_templates(self):
        """Loads and pre-renders all stroke templates in the assets/templates directory."""
        if not os.path.exists(self.templates_dir):
            print(f"Warning: Templates directory not found at {self.templates_dir}")
            return

        print(f"Pre-rendering stroke templates from {self.templates_dir}...")
        for filename in os.listdir(self.templates_dir):
            if filename.endswith(".json"):
                path = os.path.join(self.templates_dir, filename)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    
                    char = data.get("character")
                    strokes = data.get("strokes")
                    if char and strokes:
                        arr = HandwritingProcessor.render_template_to_array(strokes)
                        self.templates[char] = arr

                        val = ord(char)
                        if 0x3040 <= val <= 0x309F:
                            self.hiragana_chars.add(char)
                        elif 0x30A0 <= val <= 0x30FF:
                            self.katakana_chars.add(char)
                except Exception as e:
                    print(f"Error loading template {filename}: {e}")
        print(f"Loaded {len(self.templates)} templates.")

    def _fetch_character_strokes(self, char: str) -> Optional[List[List[List[int]]]]:
        """
        Loads strokes for a character from local JSON template.
        If missing, fetches strokes dynamically from the jsDelivr CDN and saves it locally.
        """
        import urllib.request
        import urllib.parse

        local_path = os.path.join(self.templates_dir, f"{char}.json")
        if os.path.exists(local_path):
            try:
                with open(local_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                strokes = data.get("strokes")
                if strokes:
                    return strokes
            except Exception as e:
                print(f"Error reading local template for {repr(char)}: {e}")

        hex_code = f"{ord(char):05x}"
        url = f"https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/{hex_code}.svg"
        
        print(f"Template for {repr(char)} not found locally. Fetching from KanjiVG CDN: {url}...")
        try:
            import xml.etree.ElementTree as ET
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=8) as response:
                xml_str = response.read().decode('utf-8')
                
            root = ET.fromstring(xml_str)
            path_elems = root.findall('.//{http://www.w3.org/2000/svg}path')
            
            strokes = []
            for p in path_elems:
                d = p.attrib.get('d')
                if d:
                    pts = parse_kanjivg_svg_path(d)
                    if pts:
                        strokes.append(pts)
            
            if not strokes:
                print(f"No stroke paths found in KanjiVG SVG data for {repr(char)}.")
                return None
                
            template_data = {
                "character": char,
                "strokes": strokes
            }
            os.makedirs(self.templates_dir, exist_ok=True)
            with open(local_path, "w", encoding="utf-8") as f:
                json.dump(template_data, f, indent=2, ensure_ascii=False)
                
            print(f"Successfully fetched and cached KanjiVG template for {repr(char)} locally.")
            
            arr = HandwritingProcessor.render_template_to_array(strokes)
            self.templates[char] = arr
            
            return strokes
            
        except Exception as e:
            print(f"Failed to fetch template for {repr(char)}: {e}")
            return None

    def get_or_create_word_template(self, word: str) -> Optional[np.ndarray]:
        """
        Retrieves a cached 128x128 composite array for the given word.
        """
        if word in self.word_templates:
            return self.word_templates[word]

        strokes_list = []
        for char in word:
            if char in (" ", "　", "。", "、", "？", "！"):
                continue
            strokes = self._fetch_character_strokes(char)
            if not strokes:
                print(f"Warning: Could not fetch strokes for character {repr(char)} in word {repr(word)}.")
                return None
            strokes_list.append(strokes)

        if not strokes_list:
            return None

        arr = HandwritingProcessor.render_word_template_to_array(strokes_list)
        self.word_templates[word] = arr
        return arr

    def recognize(self, image: np.ndarray, category: Optional[str] = None, allowed_words: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Compares the preprocessed drawing array with candidate templates.
        """
        u_ink = (255.0 - image.astype(float)) / 255.0
        u_blur = cv2.GaussianBlur(u_ink, (15, 15), 0)
        norm_u = np.sqrt(np.sum(u_blur ** 2))

        if norm_u < 1e-4:
            return {"best_character": "?", "score": 0.0}

        best_match = "?"
        best_score = 0.0

        if allowed_words is not None:
            for word in allowed_words:
                t_arr = self.get_or_create_word_template(word)
                if t_arr is None:
                    continue

                t_ink = (255.0 - t_arr.astype(float)) / 255.0
                t_blur = cv2.GaussianBlur(t_ink, (15, 15), 0)
                norm_t = np.sqrt(np.sum(t_blur ** 2))

                if norm_t < 1e-4:
                    continue

                dot_product = np.sum(u_blur * t_blur)
                score = dot_product / (norm_u * norm_t)

                if score > best_score:
                    best_score = score
                    best_match = word
        else:
            search_templates = self.templates
            if category == "hiragana":
                search_templates = {c: self.templates[c] for c in self.hiragana_chars if c in self.templates}
            elif category == "katakana":
                search_templates = {c: self.templates[c] for c in self.katakana_chars if c in self.templates}

            for char, t_arr in search_templates.items():
                t_ink = (255.0 - t_arr.astype(float)) / 255.0
                t_blur = cv2.GaussianBlur(t_ink, (15, 15), 0)
                norm_t = np.sqrt(np.sum(t_blur ** 2))

                if norm_t < 1e-4:
                    continue

                dot_product = np.sum(u_blur * t_blur)
                score = dot_product / (norm_u * norm_t)

                if score > best_score:
                    best_score = score
                    best_match = char

        return {
            "best_character": best_match,
            "score": round(best_score, 4)
        }


class CNNRecognizer(Recognizer):
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        
    def recognize(self, image: np.ndarray, category: Optional[str] = None, allowed_words: Optional[List[str]] = None) -> Dict[str, Any]:
        return {"best_character": allowed_words[0] if allowed_words else "あ", "score": 0.99}
