"""
Static registry of all Hiragana and Katakana packages.
Each package = one row of the kana table.
"""
from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class KanaEntry:
    kana: str
    romaji: str
    hint: str = ""


@dataclass(frozen=True)
class KanaPackage:
    name: str
    entries: List[KanaEntry]
    min_val: int = -1
    max_val: int = -1


# ── Hiragana ─────────────────────────────────────────────────────────────

HIRAGANA_BASIC: List[KanaPackage] = [
    KanaPackage("あ行 (a)", [KanaEntry("あ","a"), KanaEntry("い","i"), KanaEntry("う","u"), KanaEntry("え","e"), KanaEntry("お","o")]),
    KanaPackage("か行 (ka)", [KanaEntry("か","ka"), KanaEntry("き","ki"), KanaEntry("く","ku"), KanaEntry("け","ke"), KanaEntry("こ","ko")]),
    KanaPackage("さ行 (sa)", [KanaEntry("さ","sa"), KanaEntry("し","shi"), KanaEntry("す","su"), KanaEntry("せ","se"), KanaEntry("そ","so")]),
    KanaPackage("た行 (ta)", [KanaEntry("た","ta"), KanaEntry("ち","chi"), KanaEntry("つ","tsu"), KanaEntry("て","te"), KanaEntry("と","to")]),
    KanaPackage("な行 (na)", [KanaEntry("な","na"), KanaEntry("に","ni"), KanaEntry("ぬ","nu"), KanaEntry("ね","ne"), KanaEntry("の","no")]),
    KanaPackage("は行 (ha)", [KanaEntry("は","ha"), KanaEntry("ひ","hi"), KanaEntry("ふ","fu"), KanaEntry("へ","he"), KanaEntry("ほ","ho")]),
    KanaPackage("ま行 (ma)", [KanaEntry("ま","ma"), KanaEntry("み","mi"), KanaEntry("む","mu"), KanaEntry("め","me"), KanaEntry("も","mo")]),
    KanaPackage("や行 (ya)", [KanaEntry("や","ya"), KanaEntry("ゆ","yu"), KanaEntry("よ","yo")]),
    KanaPackage("ら行 (ra)", [KanaEntry("ら","ra"), KanaEntry("り","ri"), KanaEntry("る","ru"), KanaEntry("れ","re"), KanaEntry("ろ","ro")]),
    KanaPackage("わ行 (wa)", [KanaEntry("わ","wa"), KanaEntry("を","wo"), KanaEntry("ん","n")]),
]

HIRAGANA_EXTENDED: List[KanaPackage] = [
    KanaPackage("が行 (ga)", [KanaEntry("が","ga"), KanaEntry("ぎ","gi"), KanaEntry("ぐ","gu"), KanaEntry("げ","ge"), KanaEntry("ご","go")]),
    KanaPackage("ざ行 (za)", [KanaEntry("ざ","za"), KanaEntry("じ","ji"), KanaEntry("ず","zu"), KanaEntry("ぜ","ze"), KanaEntry("ぞ","zo")]),
    KanaPackage("だ行 (da)", [KanaEntry("だ","da"), KanaEntry("ぢ","di"), KanaEntry("づ","du"), KanaEntry("で","de"), KanaEntry("ど","do")]),
    KanaPackage("ば行 (ba)", [KanaEntry("ば","ba"), KanaEntry("び","bi"), KanaEntry("ぶ","bu"), KanaEntry("べ","be"), KanaEntry("ぼ","bo")]),
    KanaPackage("ぱ行 (pa)", [KanaEntry("ぱ","pa"), KanaEntry("ぴ","pi"), KanaEntry("ぷ","pu"), KanaEntry("ぺ","pe"), KanaEntry("ぽ","po")]),
    KanaPackage("きゃ行 (kya)", [KanaEntry("きゃ","kya"), KanaEntry("きゅ","kyu"), KanaEntry("きょ","kyo")]),
    KanaPackage("しゃ行 (sha)", [KanaEntry("しゃ","sha"), KanaEntry("しゅ","shu"), KanaEntry("しょ","sho")]),
    KanaPackage("ちゃ行 (cha)", [KanaEntry("ちゃ","cha"), KanaEntry("ちゅ","chu"), KanaEntry("ちょ","cho")]),
    KanaPackage("にゃ行 (nya)", [KanaEntry("にゃ","nya"), KanaEntry("にゅ","nyu"), KanaEntry("にょ","nyo")]),
    KanaPackage("ひゃ行 (hya)", [KanaEntry("ひゃ","hya"), KanaEntry("ひゅ","hyu"), KanaEntry("ひょ","hyo")]),
    KanaPackage("みゃ行 (mya)", [KanaEntry("みゃ","mya"), KanaEntry("みゅ","myu"), KanaEntry("みょ","myo")]),
    KanaPackage("りゃ行 (rya)", [KanaEntry("りゃ","rya"), KanaEntry("りゅ","ryu"), KanaEntry("りょ","ryo")]),
    KanaPackage("ぎゃ行 (gya)", [KanaEntry("ぎゃ","gya"), KanaEntry("ぎゅ","gyu"), KanaEntry("ぎょ","gyo")]),
    KanaPackage("じゃ行 (ja)", [KanaEntry("じゃ","ja"), KanaEntry("じゅ","ju"), KanaEntry("じょ","jo")]),
    KanaPackage("びゃ行 (bya)", [KanaEntry("びゃ","bya"), KanaEntry("びゅ","byu"), KanaEntry("びょ","byo")]),
    KanaPackage("ぴゃ行 (pya)", [KanaEntry("ぴゃ","pya"), KanaEntry("ぴゅ","pyu"), KanaEntry("ぴょ","pyo")]),
]

# ── Katakana ─────────────────────────────────────────────────────────────

KATAKANA_BASIC: List[KanaPackage] = [
    KanaPackage("ア行 (a)", [KanaEntry("ア","a"), KanaEntry("イ","i"), KanaEntry("ウ","u"), KanaEntry("エ","e"), KanaEntry("オ","o")]),
    KanaPackage("カ行 (ka)", [KanaEntry("カ","ka"), KanaEntry("キ","ki"), KanaEntry("ク","ku"), KanaEntry("ケ","ke"), KanaEntry("コ","ko")]),
    KanaPackage("サ行 (sa)", [KanaEntry("サ","sa"), KanaEntry("シ","shi"), KanaEntry("ス","su"), KanaEntry("セ","se"), KanaEntry("ソ","so")]),
    KanaPackage("タ行 (ta)", [KanaEntry("タ","ta"), KanaEntry("チ","chi"), KanaEntry("ツ","tsu"), KanaEntry("テ","te"), KanaEntry("ト","to")]),
    KanaPackage("ナ行 (na)", [KanaEntry("ナ","na"), KanaEntry("ニ","ni"), KanaEntry("ヌ","nu"), KanaEntry("ネ","ne"), KanaEntry("ノ","no")]),
    KanaPackage("ハ行 (ha)", [KanaEntry("ハ","ha"), KanaEntry("ヒ","hi"), KanaEntry("フ","fu"), KanaEntry("ヘ","he"), KanaEntry("ホ","ho")]),
    KanaPackage("マ行 (ma)", [KanaEntry("マ","ma"), KanaEntry("ミ","mi"), KanaEntry("ム","mu"), KanaEntry("メ","me"), KanaEntry("モ","mo")]),
    KanaPackage("ヤ行 (ya)", [KanaEntry("ヤ","ya"), KanaEntry("ユ","yu"), KanaEntry("ヨ","yo")]),
    KanaPackage("ラ行 (ra)", [KanaEntry("ラ","ra"), KanaEntry("リ","ri"), KanaEntry("ル","ru"), KanaEntry("レ","re"), KanaEntry("ロ","ro")]),
    KanaPackage("ワ行 (wa)", [KanaEntry("ワ","wa"), KanaEntry("ヲ","wo"), KanaEntry("ン","n")]),
]

KATAKANA_EXTENDED: List[KanaPackage] = [
    KanaPackage("ガ行 (ga)", [KanaEntry("ガ","ga"), KanaEntry("ギ","gi"), KanaEntry("グ","gu"), KanaEntry("ゲ","ge"), KanaEntry("ゴ","go")]),
    KanaPackage("ザ行 (za)", [KanaEntry("ザ","za"), KanaEntry("ジ","ji"), KanaEntry("ズ","zu"), KanaEntry("ゼ","ze"), KanaEntry("ゾ","zo")]),
    KanaPackage("ダ行 (da)", [KanaEntry("ダ","da"), KanaEntry("ヂ","di"), KanaEntry("ヅ","du"), KanaEntry("デ","de"), KanaEntry("ド","do")]),
    KanaPackage("バ行 (ba)", [KanaEntry("バ","ba"), KanaEntry("ビ","bi"), KanaEntry("ブ","bu"), KanaEntry("ベ","be"), KanaEntry("ボ","bo")]),
    KanaPackage("パ行 (pa)", [KanaEntry("パ","pa"), KanaEntry("ピ","pi"), KanaEntry("プ","pu"), KanaEntry("ペ","pe"), KanaEntry("ポ","po")]),
    KanaPackage("キャ行 (kya)", [KanaEntry("キャ","kya"), KanaEntry("キュ","kyu"), KanaEntry("キョ","kyo")]),
    KanaPackage("シャ行 (sha)", [KanaEntry("シャ","sha"), KanaEntry("シュ","shu"), KanaEntry("ショ","sho")]),
    KanaPackage("チャ行 (cha)", [KanaEntry("チャ","cha"), KanaEntry("チュ","chu"), KanaEntry("チョ","cho")]),
    KanaPackage("ニャ行 (nya)", [KanaEntry("ニャ","nya"), KanaEntry("ニュ","nyu"), KanaEntry("ニョ","nyo")]),
    KanaPackage("ヒャ行 (hya)", [KanaEntry("ヒャ","hya"), KanaEntry("ヒュ","hyu"), KanaEntry("ヒョ","hyo")]),
    KanaPackage("ミャ行 (mya)", [KanaEntry("ミャ","mya"), KanaEntry("ミュ","myu"), KanaEntry("ミョ","myo")]),
    KanaPackage("リャ行 (rya)", [KanaEntry("リャ","rya"), KanaEntry("リュ","ryu"), KanaEntry("リョ","ryo")]),
    KanaPackage("ギャ行 (gya)", [KanaEntry("ギャ","gya"), KanaEntry("ギュ","gyu"), KanaEntry("ギョ","gyo")]),
    KanaPackage("ジャ行 (ja)", [KanaEntry("ジャ","ja"), KanaEntry("ジュ","ju"), KanaEntry("ジョ","jo")]),
    KanaPackage("ビャ行 (bya)", [KanaEntry("ビャ","bya"), KanaEntry("ビュ","byu"), KanaEntry("ビョ","byo")]),
    KanaPackage("ピャ行 (pya)", [KanaEntry("ピャ","pya"), KanaEntry("ピュ","pyu"), KanaEntry("ピョ","pyo")]),
]


# ── Accessors ─────────────────────────────────────────────────────────────

def get_hiragana_basic() -> List[KanaPackage]:
    return HIRAGANA_BASIC

def get_hiragana_extended() -> List[KanaPackage]:
    return HIRAGANA_EXTENDED

def get_katakana_basic() -> List[KanaPackage]:
    return KATAKANA_BASIC

def get_katakana_extended() -> List[KanaPackage]:
    return KATAKANA_EXTENDED


def int_to_japanese(num: int) -> tuple[str, str]:
    if num < 1 or num > 99999:
        raise ValueError("Number out of range (1-99999)")

    digits_h = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"]
    digits_r = ["", "ichi", "ni", "san", "yon", "go", "roku", "nana", "hachi", "kyuu"]

    parts_h = []
    parts_r = []

    # 1. Ten Thousands (man)
    man = num // 10000
    if man > 0:
        parts_h.append(digits_h[man] + "まん")
        parts_r.append(digits_r[man] + "man")

    # 2. Thousands (sen)
    sen = (num % 10000) // 1000
    if sen > 0:
        if sen == 1:
            parts_h.append("せん")
            parts_r.append("sen")
        elif sen == 3:
            parts_h.append("さんぜん")
            parts_r.append("sanzen")
        elif sen == 8:
            parts_h.append("はっせん")
            parts_r.append("hassen")
        else:
            parts_h.append(digits_h[sen] + "せん")
            parts_r.append(digits_r[sen] + "sen")

    # 3. Hundreds (hyaku)
    hyaku = (num % 1000) // 100
    if hyaku > 0:
        if hyaku == 1:
            parts_h.append("ひゃく")
            parts_r.append("hyaku")
        elif hyaku == 3:
            parts_h.append("さんびゃく")
            parts_r.append("sanbyaku")
        elif hyaku == 6:
            parts_h.append("ろっぴゃく")
            parts_r.append("roppyaku")
        elif hyaku == 8:
            parts_h.append("はっぴゃく")
            parts_r.append("happyaku")
        else:
            parts_h.append(digits_h[hyaku] + "ひゃく")
            parts_r.append(digits_r[hyaku] + "hyaku")

    # 4. Tens (juu)
    juu = (num % 100) // 10
    if juu > 0:
        if juu == 1:
            parts_h.append("じゅう")
            parts_r.append("juu")
        else:
            parts_h.append(digits_h[juu] + "じゅう")
            parts_r.append(digits_r[juu] + "juu")

    # 5. Ones (ichi)
    ichi = num % 10
    if ichi > 0:
        parts_h.append(digits_h[ichi])
        parts_r.append(digits_r[ichi])

    return "".join(parts_h), "".join(parts_r)


def get_number_packages() -> List[KanaPackage]:
    import random

    def generate_samples(min_val: int, max_val: int) -> List[KanaEntry]:
        samples = []
        nums = set()
        count = min(8, max_val - min_val + 1)
        while len(nums) < count:
            nums.add(random.randint(min_val, max_val))
        for n in sorted(list(nums)):
            h, r = int_to_japanese(n)
            samples.append(KanaEntry(str(n), r, h))
        return samples

    return [
        KanaPackage("Hàng đơn vị (1 - 9)", generate_samples(1, 9), min_val=1, max_val=9),
        KanaPackage("Hàng chục (10 - 99)", generate_samples(10, 99), min_val=10, max_val=99),
        KanaPackage("Hàng trăm (100 - 999)", generate_samples(100, 999), min_val=100, max_val=999),
        KanaPackage("Hàng nghìn (1000 - 9999)", generate_samples(1000, 9999), min_val=1000, max_val=9999),
        KanaPackage("Hàng vạn (10000 - 99999)", generate_samples(10000, 99999), min_val=10000, max_val=99999),
    ]

