import { VocabPackModel } from '../models/VocabPack';
import { Word } from '../models/Word';
import {
  PACK_00_WORDS,
  PACK_01_WORDS,
  PACK_02_WORDS,
  PACK_03_WORDS,
  PACK_08_WORDS,
  PACK_09_WORDS,
  PACK_10_WORDS,
  PACK_11_WORDS,
  PACK_12_WORDS,
  PACK_13_WORDS,
  PACK_14_WORDS,
  DAYS_WEEK_WORDS,
  DAYS_MONTH_WORDS,
  MONTHS_WORDS,
  YEARS_WORDS,
  BIRTH_YEAR_WORDS,
} from '@/data/wordData';

/**
 * Registry Pattern for Managing Built-in & Static Vocabulary Packs.
 * Allows O(1) dynamic registration and lookup without modifying Enums or switch cases.
 */
export class PackRegistry {
  private static instance: PackRegistry;
  private packs: Map<string, VocabPackModel> = new Map();
  private initialized = false;

  private constructor() {
    this.bootstrapBuiltInPacks();
  }

  public static getInstance(): PackRegistry {
    if (!PackRegistry.instance) {
      PackRegistry.instance = new PackRegistry();
    }
    return PackRegistry.instance;
  }

  /**
   * Register a new vocabulary pack into the system.
   */
  public register(pack: VocabPackModel): void {
    this.packs.set(pack.id, pack);
  }

  /**
   * Get a registered pack by ID.
   */
  public get(id: string): VocabPackModel | undefined {
    return this.packs.get(id);
  }

  /**
   * Check if a pack is registered.
   */
  public has(id: string): boolean {
    return this.packs.has(id);
  }

  /**
   * Return all registered packs.
   */
  public getAll(): VocabPackModel[] {
    return Array.from(this.packs.values());
  }

  /**
   * Return list of registered pack IDs.
   */
  public getIds(): string[] {
    return Array.from(this.packs.keys());
  }

  /**
   * Pre-load built-in packs on start.
   */
  private bootstrapBuiltInPacks(): void {
    if (this.initialized) return;

    const mapToWords = (rawWords: any[]) => rawWords.map((w) => Word.fromJSON(w));

    // Ordered by highest pack number down to 00, then specialized categories
    const initialDefinitions: Array<{
      id: string;
      name: string;
      description: string;
      words: any[];
      supportsHandwriting: boolean;
    }> = [
      {
        id: 'pack_14',
        name: 'Gói từ vựng 14',
        description: 'Gói học từ vựng bài 14: Tập quán, Cuộc sống, Giao thông & Đô thị (76 từ)',
        words: PACK_14_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_13',
        name: 'Gói từ vựng 13',
        description: 'Gói học từ vựng bài 13: Mua sắm, Du lịch, Trang phục & Đời sống (49 từ)',
        words: PACK_13_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_12',
        name: 'Gói từ vựng 12',
        description: 'Gói học từ vựng bài 12: Sức khỏe, Y tế, Thể chất & Đời sống (61 từ)',
        words: PACK_12_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_11',
        name: 'Gói từ vựng 11',
        description: 'Gói học từ vựng bài 11: Đời sống, Thói quen, Cảm xúc & Giao tiếp (52 từ)',
        words: PACK_11_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_10',
        name: 'Gói từ vựng 10',
        description: 'Gói học từ vựng bài 10: Chỉ đường, Quy tắc, Động vật & Tham quan (82 từ)',
        words: PACK_10_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_09',
        name: 'Gói từ vựng 09',
        description: 'Gói học từ vựng bài 9: Sở thích, Hoạt động, Lượng từ, Thủ tục & Sự kiện (70 từ)',
        words: PACK_09_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_08',
        name: 'Gói từ vựng 08',
        description: 'Gói học từ vựng bài 8: Gia đình, Ngoại hình, Tính cách, Quà tặng & Lễ hội (88 từ)',
        words: PACK_08_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_03',
        name: 'Gói từ vựng 03',
        description: 'Gói học từ vựng bài 3: Thời gian, Động từ, Địa điểm & Sinh hoạt (99 từ)',
        words: PACK_03_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_02',
        name: 'Gói từ vựng 02',
        description: 'Gói học từ vựng bài 2: Mua sắm, Đồ vật, Thực phẩm & Vật dụng (106 từ)',
        words: PACK_02_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_01',
        name: 'Gói từ vựng 01',
        description: 'Gói học từ vựng bài 1 tổng hợp (Danh xưng, Xã hội & Ngành nghề - 41 từ)',
        words: PACK_01_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'pack_00',
        name: 'Gói từ vựng 00',
        description: 'Tổng hợp Số, Thứ, Ngày, Tháng, Năm và Năm sinh (75 từ)',
        words: PACK_00_WORDS,
        supportsHandwriting: true,
      },
      {
        id: 'days_week',
        name: 'Thứ trong tuần',
        description: 'Cách đọc 7 ngày thứ trong tuần tiếng Nhật (7 từ)',
        words: DAYS_WEEK_WORDS,
        supportsHandwriting: false,
      },
      {
        id: 'days_month',
        name: 'Ngày trong tháng (31 ngày)',
        description: 'Cách đọc 31 ngày trong tháng (31 từ)',
        words: DAYS_MONTH_WORDS,
        supportsHandwriting: false,
      },
      {
        id: 'days_month_special',
        name: 'Ngày đặc biệt (1-10, 14, 20, 24)',
        description: 'Cách đọc các ngày biến âm đặc biệt trong tháng (13 từ)',
        words: DAYS_MONTH_WORDS.filter((w) =>
          ['1日', '2日', '3日', '4日', '5日', '6日', '7日', '8日', '9日', '10日', '14日', '20日', '24日'].includes(w.word)
        ),
        supportsHandwriting: false,
      },
      {
        id: 'months',
        name: 'Tháng trong năm',
        description: 'Cách đọc 12 tháng và các lưu ý biến âm (12 từ)',
        words: MONTHS_WORDS,
        supportsHandwriting: false,
      },
      {
        id: 'years',
        name: 'Năm tiếng Nhật',
        description: 'Quy tắc đọc năm và các trường hợp đặc biệt (5 từ)',
        words: YEARS_WORDS,
        supportsHandwriting: false,
      },
      {
        id: 'birth_year',
        name: 'Năm sinh',
        description: 'Giới thiệu năm sinh tiếng Nhật (7 từ)',
        words: BIRTH_YEAR_WORDS,
        supportsHandwriting: false,
      },
    ];

    for (const def of initialDefinitions) {
      const model = new VocabPackModel(
        def.id,
        def.name,
        def.description,
        mapToWords(def.words),
        false,
        def.supportsHandwriting
      );
      this.register(model);
    }

    this.initialized = true;
  }
}
