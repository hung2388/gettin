import os
import sys
import json
import numpy as np

# Adjust python path to import packages correctly
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

from handwriting import HandwritingProcessor, TemplateRecognizer

# Configure stdout encoding to prevent Unicode errors
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def run_tests():
    templates_dir = os.path.join(base_dir, "assets", "templates")
    print(f"Initializing TemplateRecognizer with {templates_dir}...")
    recognizer = TemplateRecognizer(templates_dir)
    
    if not recognizer.templates:
        print("FAIL: No templates loaded!")
        sys.exit(1)
        
    print("\n--- Running Test 1: Self-recognition of U+3042 ('a') ---")
    path_a = os.path.join(templates_dir, "あ.json")
    if not os.path.exists(path_a):
        print(f"FAIL: Template file not found: {path_a}")
        sys.exit(1)
        
    with open(path_a, "r", encoding="utf-8") as f:
        data_a = json.load(f)
        
    # Render strokes to 128x128 array simulating user drawing
    rendered_a = HandwritingProcessor.render_template_to_array(data_a["strokes"])
    
    # Run recognizer on this image
    result = recognizer.recognize(rendered_a, category="hiragana")
    # Print representation to avoid Unicode errors
    print("Recognition Result:", repr(result))
    
    # Assertions
    assert result["best_character"] == "あ", f"Expected 'あ', got {repr(result['best_character'])}"
    assert result["score"] > 0.95, f"Expected high score for identical match, got {result['score']}"
    print("SUCCESS: 'あ' recognized correctly with score", result["score"])

    print("\n--- Running Test 2: Self-recognition of U+3044 ('i') ---")
    path_i = os.path.join(templates_dir, "い.json")
    if os.path.exists(path_i):
        with open(path_i, "r", encoding="utf-8") as f:
            data_i = json.load(f)
        rendered_i = HandwritingProcessor.render_template_to_array(data_i["strokes"])
        result_i = recognizer.recognize(rendered_i, category="hiragana")
        print("Recognition Result:", repr(result_i))
        assert result_i["best_character"] == "い", f"Expected 'い', got {repr(result_i['best_character'])}"
        print("SUCCESS: 'い' recognized correctly with score", result_i["score"])
    else:
        print("Skipping 'い' test: template not found")

    print("\n--- Running Test 3: Cross-matching (Discrimination) ---")
    result_cross = recognizer.recognize(rendered_a, category="hiragana")
    print("Cross-Recognition Result for 'あ' rendering:", repr(result_cross))
    assert result_cross["best_character"] == "あ", "Failed discrimination check"
    print("\n--- Running Test 4: Dynamic Fetching and Word Template Matching for '名前' ---")
    word = "名前"
    # This should dynamically fetch stroke JSONs for '名' and '前' from CDN, render them side-by-side,
    # cache them, and perform matching.
    t_arr = recognizer.get_or_create_word_template(word)
    if t_arr is None:
        print("FAIL: Could not generate composite template for '名前'")
        sys.exit(1)
        
    # Check that individual files were created in local directory
    path_ming = os.path.join(templates_dir, "名.json")
    path_qian = os.path.join(templates_dir, "前.json")
    assert os.path.exists(path_ming), "Expected '名.json' to be cached locally"
    assert os.path.exists(path_qian), "Expected '前.json' to be cached locally"
    print("SUCCESS: Stroke templates for '名' and '前' fetched and cached locally.")
    
    # Recognize the template array itself against the word list to verify matching
    allowed = ["名前", "アメリカ", "イタリア"]
    result_word = recognizer.recognize(t_arr, allowed_words=allowed)
    print("Word Recognition Result for '名前' template:", repr(result_word))
    assert result_word["best_character"] == "名前", f"Expected '名前', got {repr(result_word['best_character'])}"
    assert result_word["score"] > 0.95, f"Expected high score for identical match, got {result_word['score']}"
    print("SUCCESS: '名前' word template matching succeeded with score", result_word["score"])

    print("\nAll unit tests passed successfully!")

if __name__ == "__main__":
    run_tests()
