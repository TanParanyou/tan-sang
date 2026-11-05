import { describe, expect, it } from 'vitest';
import { MemorySequenceStorage, NumberingEngine } from '@/server/sequences/numbering-engine';

describe('NumberingEngine (Zero-Collision Document Numbering)', () => {
  it('formats document number according to template and date', async () => {
    const storage = new MemorySequenceStorage();
    const engine = new NumberingEngine(storage);
    const fixedDate = new Date('2026-11-05T12:00:00Z');

    const num1 = await engine.nextNumber({
      scope: 'BKK',
      docType: 'INV',
      periodFormat: 'YYYYMM',
      template: '{SCOPE}-{TYPE}-{YEAR:YY}{MONTH:MM}-{SEQ:4}',
      date: fixedDate,
    });

    expect(num1).toBe('BKK-INV-2611-0001');

    const num2 = await engine.nextNumber({
      scope: 'BKK',
      docType: 'INV',
      periodFormat: 'YYYYMM',
      template: '{SCOPE}-{TYPE}-{YEAR:YY}{MONTH:MM}-{SEQ:4}',
      date: fixedDate,
    });

    expect(num2).toBe('BKK-INV-2611-0002');
  });

  it('isolates sequences across different scopes and document types', async () => {
    const storage = new MemorySequenceStorage();
    const engine = new NumberingEngine(storage);

    const bkkNum = await engine.nextNumber({ scope: 'BKK', docType: 'BILL' });
    const cnxNum = await engine.nextNumber({ scope: 'CNX', docType: 'BILL' });
    const bkkRec = await engine.nextNumber({ scope: 'BKK', docType: 'REC' });

    expect(bkkNum).toContain('-0001');
    expect(cnxNum).toContain('-0001');
    expect(bkkRec).toContain('-0001');
  });

  it('handles high concurrent generation without duplicates', async () => {
    const storage = new MemorySequenceStorage();
    const engine = new NumberingEngine(storage);

    const count = 50;
    const promises = Array.from({ length: count }, () =>
      engine.nextNumber({
        scope: 'CONCURRENT',
        docType: 'TEST',
        periodFormat: 'ALL',
        template: '{SEQ:4}',
      }),
    );

    const results = await Promise.all(promises);
    const unique = new Set(results);

    expect(unique.size).toBe(count);
    expect(results).toContain('0001');
    expect(results).toContain('0050');
  });
});
