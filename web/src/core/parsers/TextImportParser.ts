import { Word } from '../models/Word';

export interface ParseResult {
  words: Word[];
  totalLines: number;
  validCount: number;
  formatDetected: string;
  errors: string[];
}

export interface ITextParserStrategy {
  canParse(raw: string): boolean;
  parse(raw: string): ParseResult;
}

/**
 * Strategy 1: Delimited Text Parser (Tabs, Pipes, Colons, Commas, Hyphens, Arrows)
 * Handles pasting directly from Excel, Google Sheets, Word, Quizlet, ChatGPT, Anki.
 */
export class DelimitedTextParser implements ITextParserStrategy {
  public canParse(raw: string): boolean {
    return typeof raw === 'string' && raw.trim().length > 0;
  }

  public parse(raw: string): ParseResult {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const words: Word[] = [];
    const errors: string[] = [];

    let formatDetected = 'Tự động phát hiện (Tab / Ký tự phân cách)';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore comment lines starting with # or //
      if (line.startsWith('#') || line.startsWith('//')) {
        continue;
      }

      // Detect separator: Tab > Pipe > Colon > Semicolon > Comma > Arrow/Dash
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
        formatDetected = 'Excel / Google Sheets (Tab)';
      } else if (line.includes('|')) {
        parts = line.split('|');
        formatDetected = 'Dấu gạch đứng (|)';
      } else if (line.includes('：')) {
        parts = line.split('：');
        formatDetected = 'Dấu hai chấm Nhật (：)';
      } else if (line.includes(':')) {
        parts = line.split(':');
        formatDetected = 'Dấu hai chấm (:)';
      } else if (line.includes(';')) {
        parts = line.split(';');
        formatDetected = 'Dấu chấm phẩy (;)';
      } else if (line.includes('->') || line.includes('➔') || line.includes('→')) {
        parts = line.split(/->|➔|→/);
        formatDetected = 'Mũi tên (->)';
      } else if (line.includes(' - ')) {
        parts = line.split(' - ');
        formatDetected = 'Dấu gạch ngang ( - )';
      } else if (line.includes(',')) {
        parts = line.split(',');
        formatDetected = 'Dấu phẩy (CSV)';
      } else {
        // Fallback: split by multiple spaces (e.g. 2 or more spaces)
        parts = line.split(/\s{2,}/);
      }

      parts = parts.map((p) => p.trim()).filter((p) => p.length > 0);

      if (parts.length === 0) continue;

      let wordStr = '';
      let kanaStr = '';
      let romajiStr = '';
      let meaningStr = '';

      if (parts.length >= 4) {
        // Form: Word | Kana | Romaji | Meaning
        wordStr = parts[0];
        kanaStr = parts[1];
        romajiStr = parts[2];
        meaningStr = parts.slice(3).join(' - ');
      } else if (parts.length === 3) {
        // Form: Word | (Kana or Romaji) | Meaning
        wordStr = parts[0];
        const middle = parts[1];
        meaningStr = parts[2];

        // Check if middle is mostly ASCII (Romaji) or Kana (Japanese characters)
        if (this.isKana(middle)) {
          kanaStr = middle;
          romajiStr = this.kanaToRomaji(middle);
        } else {
          romajiStr = middle;
          kanaStr = this.isKana(wordStr) ? wordStr : '';
        }
      } else if (parts.length === 2) {
        // Form: Word | Meaning
        wordStr = parts[0];
        meaningStr = parts[1];

        // If word has brackets e.g. "私 [わたし]" or "食べる (たべる)"
        const bracketMatch = wordStr.match(/^([^[(\s]+)\s*[[(\s]([^\])]+)[\])]/);
        if (bracketMatch) {
          wordStr = bracketMatch[1].trim();
          kanaStr = bracketMatch[2].trim();
          romajiStr = this.kanaToRomaji(kanaStr);
        } else if (this.isKana(wordStr)) {
          kanaStr = wordStr;
          romajiStr = this.kanaToRomaji(wordStr);
        }
      } else {
        // 1 part only
        wordStr = parts[0];
        meaningStr = parts[0];
        if (this.isKana(wordStr)) {
          kanaStr = wordStr;
          romajiStr = this.kanaToRomaji(wordStr);
        }
      }

      const w = new Word(wordStr, meaningStr, romajiStr, kanaStr);
      if (w.isValid()) {
        words.push(w);
      } else {
        errors.push(`Dòng ${i + 1}: Thiếu từ hoặc nghĩa ("${line}")`);
      }
    }

    return {
      words,
      totalLines: lines.length,
      validCount: words.length,
      formatDetected,
      errors,
    };
  }

  private isKana(str: string): boolean {
    return /[\u3040-\u309F\u30A0-\u30FF]/.test(str);
  }

  /**
   * Lightweight basic kana to romaji transliteration for convenience
   */
  private kanaToRomaji(kana: string): string {
    const table: Record<string, string> = {
      あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
      か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
      さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
      た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
      な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
      は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
      ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
      や: 'ya', ゆ: 'yu', よ: 'yo',
      ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
      わ: 'wa', を: 'wo', ん: 'n',
      が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
      ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
      だ: 'da', ぢ: 'ji', づ: 'dzu', で: 'de', ど: 'do',
      ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
      ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
      // Katakana basic
      ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
      カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
      サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
      タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
      ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
      ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
      マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
      ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
      ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
      ワ: 'wa', ヲ: 'wo', ン: 'n',
      ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
      ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
      ダ: 'da', ヂ: 'ji', ヅ: 'dzu', デ: 'de', ド: 'do',
      バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
      パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
    };

    let romaji = '';
    let i = 0;
    while (i < kana.length) {
      const ch = kana[i];
      if (table[ch]) {
        romaji += table[ch];
      } else {
        romaji += ch;
      }
      i++;
    }
    return romaji;
  }
}

/**
 * Strategy 2: JSON Format Parser
 */
export class JsonTextParser implements ITextParserStrategy {
  public canParse(raw: string): boolean {
    const trimmed = raw.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }

  public parse(raw: string): ParseResult {
    try {
      const data = JSON.parse(raw);
      const rawWords = Array.isArray(data) ? data : Array.isArray(data.words) ? data.words : [];
      const words = rawWords.map((item: any) => Word.fromJSON(item)).filter((w: Word) => w.isValid());

      return {
        words,
        totalLines: rawWords.length,
        validCount: words.length,
        formatDetected: 'Định dạng JSON chuẩn',
        errors: [],
      };
    } catch (err: any) {
      return {
        words: [],
        totalLines: 0,
        validCount: 0,
        formatDetected: 'Lỗi JSON',
        errors: [`Không thể phân tích cú pháp JSON: ${err.message}`],
      };
    }
  }
}

/**
 * Context class that coordinates parsers based on content strategy
 */
export class SmartImportService {
  private static instance: SmartImportService;
  private jsonParser = new JsonTextParser();
  private textParser = new DelimitedTextParser();

  public static getInstance(): SmartImportService {
    if (!SmartImportService.instance) {
      SmartImportService.instance = new SmartImportService();
    }
    return SmartImportService.instance;
  }

  public parseText(input: string): ParseResult {
    if (!input || !input.trim()) {
      return {
        words: [],
        totalLines: 0,
        validCount: 0,
        formatDetected: 'Trống',
        errors: ['Vui lòng nhập nội dung'],
      };
    }

    if (this.jsonParser.canParse(input)) {
      const jsonRes = this.jsonParser.parse(input);
      if (jsonRes.words.length > 0) return jsonRes;
    }

    return this.textParser.parse(input);
  }
}
