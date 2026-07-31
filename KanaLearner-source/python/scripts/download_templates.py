import os
import urllib.request
import json

def download_and_extract():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    templates_dir = os.path.join(base_dir, "assets", "templates")
    os.makedirs(templates_dir, exist_ok=True)
    
    urls = {
        "Hiragana": "https://cdn.jsdelivr.net/npm/kana-svg-data/dist/allHiragana.json",
        "Katakana": "https://cdn.jsdelivr.net/npm/kana-svg-data/dist/allKatakana.json"
    }
    
    for name, url in urls.items():
        print(f"Downloading {name} database from {url}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            print(f"Processing {len(data)} {name} characters...")
            saved_count = 0
            for char_obj in data:
                char_code = char_obj.get("charCode")
                if not char_code:
                    continue
                    
                char = chr(char_code)
                medians = char_obj.get("medians", [])
                
                # Format: "strokes": [ [[x, y], [x, y], ...], ... ]
                strokes = []
                for med in medians:
                    val = med.get("value")
                    if val and isinstance(val, list):
                        strokes.append(val)
                
                if not strokes:
                    # Skip characters without stroke data
                    continue
                    
                # Create simplified JSON template
                template_data = {
                    "character": char,
                    "strokes": strokes
                }
                
                # Save to templates directory
                file_path = os.path.join(templates_dir, f"{char}.json")
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(template_data, f, indent=2, ensure_ascii=False)
                saved_count += 1
                
            print(f"Successfully saved {saved_count} {name} templates to {templates_dir}")
            
        except Exception as e:
            print(f"Error processing {name}: {e}")

def download_kanji_templates(kanji_chars: list[str]):
    """Downloads stroke templates for Kanji characters from KanjiVG repository."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    templates_dir = os.path.join(base_dir, "assets", "templates")
    
    # Import recognizer to reuse parse_kanjivg_svg_path
    import sys
    sys.path.append(base_dir)
    from handwriting.recognizer import TemplateRecognizer
    
    recognizer = TemplateRecognizer(templates_dir)
    print(f"\nDownloading {len(kanji_chars)} Kanji templates from KanjiVG...")
    for char in kanji_chars:
        recognizer._fetch_character_strokes(char)

if __name__ == "__main__":
    download_and_extract()
    # Sample list of Kanji characters used in vocabulary packs
    sample_kanji = ["名", "前", "国", "韓", "国", "中", "高", "校", "大", "学", "教", "室", "会", "社", "員", "人", "生", "日", "歳", "趣", "味", "水", "泳", "映", "画", "音", "楽", "読", "書", "旅", "行", "料", "理"]
    download_kanji_templates(sample_kanji)

