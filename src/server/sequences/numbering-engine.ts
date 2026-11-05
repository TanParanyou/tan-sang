import type { SupabaseClient } from '@supabase/supabase-js';

export interface NextNumberOptions {
  scope?: string;
  docType: string;
  periodFormat?: 'YYYYMM' | 'YYYY' | 'YYYYMMDD' | 'ALL';
  template?: string; // e.g. '{SCOPE}-{TYPE}-{YEAR:YY}{MONTH:MM}-{SEQ:4}'
  date?: Date;
}

export interface ISequenceStorage {
  nextSequence(scope: string, docType: string, period: string): Promise<number>;
}

export class MemorySequenceStorage implements ISequenceStorage {
  private counters = new Map<string, number>();

  async nextSequence(scope: string, docType: string, period: string): Promise<number> {
    const key = `${scope}:${docType}:${period}`;
    const current = this.counters.get(key) ?? 0;
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }
}

export class SupabaseSequenceStorage implements ISequenceStorage {
  constructor(private readonly client: SupabaseClient) {}

  async nextSequence(scope: string, docType: string, period: string): Promise<number> {
    const { data, error } = await this.client.rpc('next_document_sequence', {
      p_scope: scope,
      p_doc_type: docType,
      p_period: period,
    });

    if (error) {
      throw new Error(`Failed to generate sequence: ${error.message}`);
    }

    return Number(data);
  }
}

export class NumberingEngine {
  constructor(private readonly storage: ISequenceStorage) {}

  async nextNumber(options: NextNumberOptions): Promise<string> {
    const scope = options.scope ?? 'TS';
    const docType = options.docType;
    const template = options.template ?? '{SCOPE}-{TYPE}-{YEAR:YY}{MONTH:MM}-{SEQ:4}';
    const date = options.date ?? new Date();

    const yyyy = date.getFullYear().toString();
    const yy = yyyy.slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');

    let period = 'ALL';
    if (options.periodFormat === 'YYYYMM') {
      period = `${yyyy}${mm}`;
    } else if (options.periodFormat === 'YYYY') {
      period = yyyy;
    } else if (options.periodFormat === 'YYYYMMDD') {
      period = `${yyyy}${mm}${dd}`;
    }

    const seqNumber = await this.storage.nextSequence(scope, docType, period);

    // Format template
    let result = template
      .replace(/{SCOPE}/g, scope)
      .replace(/{TYPE}/g, docType)
      .replace(/{PREFIX}/g, scope)
      .replace(/{YEAR:YYYY}/g, yyyy)
      .replace(/{YEAR:YY}/g, yy)
      .replace(/{MONTH:MM}/g, mm)
      .replace(/{DAY:DD}/g, dd);

    result = result.replace(/{SEQ:(\d+)}/g, (_, digits) => {
      const length = parseInt(digits, 10);
      return seqNumber.toString().padStart(length, '0');
    });

    return result;
  }
}

// Global default instance with memory storage
const defaultMemoryStorage = new MemorySequenceStorage();
export const numberingEngine = new NumberingEngine(defaultMemoryStorage);
