import { describe, expect, it } from 'vitest';
import {
  calculateSplitBill,
  formatSplitBillCopyText,
  parseQuickPasteText,
  reorderArray,
  sortSplitItems,
  encodeSplitBillToUrl,
  decodeSplitBillFromUrl,
} from '@/features/split-calculator/split-calculator.service';

describe('Split Calculator Service (ตาลหาร - Tan-Harn)', () => {
  it('correctly calculates Block 1 from sheet (Subtotal 576, Delivery 12, Discount 83)', () => {
    const input = {
      deliveryFee: 12,
      discount: 83,
      items: [
        { id: '1', name: 'กัส', price: 79.5 },
        { id: '2', name: 'ตาล', price: 79.5 },
        { id: '3', name: 'เอฟ', price: 79.5 },
        { id: '4', name: 'บอส', price: 79.5 },
        { id: '5', name: 'โก', price: 59.5 },
        { id: '6', name: 'ชล', price: 59.5 },
        { id: '7', name: 'ฟิม', price: 59.5 },
        { id: '8', name: 'มีน', price: 79.5 },
      ],
      splitMethod: 'PROPORTIONAL' as const,
      roundToInteger: true,
    };

    const result = calculateSplitBill(input);

    expect(result.subtotal).toBe(576);
    expect(result.deliveryFee).toBe(12);
    expect(result.discount).toBe(83);
    expect(result.netDiscount).toBe(71);
    expect(result.grandTotal).toBe(505);

    // Member 1 (กัส: 79.5 / 576 = ~13.8%, discount = 10, final = 70)
    const gus = result.members.find((m) => m.name === 'กัส');
    expect(gus).toBeDefined();
    expect(gus?.percentShare).toBeCloseTo(13.8, 1);
    expect(gus?.discountAmount).toBe(10);
    expect(gus?.finalPrice).toBe(70);

    // Member 5 (โก: 59.5 / 576 = ~10.33%, discount = 7, final = 53)
    const go = result.members.find((m) => m.name === 'โก');
    expect(go).toBeDefined();
    expect(go?.percentShare).toBeCloseTo(10.33, 1);
    expect(go?.discountAmount).toBe(7);
    expect(go?.finalPrice).toBe(53);
  });

  it('correctly calculates Block 3 from sheet (Subtotal 200, Delivery 20, Discount 30)', () => {
    const input = {
      deliveryFee: 20,
      discount: 30,
      items: [
        { id: '1', name: 'เกม', price: 35 },
        { id: '2', name: 'พลอย', price: 45 },
        { id: '3', name: 'แทน', price: 40 },
        { id: '4', name: 'ส้มโอ', price: 40 },
        { id: '5', name: 'แบงค์', price: 40 },
      ],
      splitMethod: 'PROPORTIONAL' as const,
      roundToInteger: true,
    };

    const result = calculateSplitBill(input);

    expect(result.subtotal).toBe(200);
    expect(result.deliveryFee).toBe(20);
    expect(result.discount).toBe(30);
    expect(result.netDiscount).toBe(10);
    expect(result.grandTotal).toBe(190);
    expect(result.totalCollected).toBe(190);
    expect(result.roundingDifference).toBe(0);

    expect(result.members[0]).toMatchObject({
      name: 'เกม',
      originalPrice: 35,
      percentShare: 17.5,
      discountAmount: 2,
      finalPrice: 33,
    });

    expect(result.members[1]).toMatchObject({
      name: 'พลอย',
      originalPrice: 45,
      percentShare: 22.5,
      discountAmount: 2,
      finalPrice: 43,
    });
  });

  it('correctly calculates Block 4 from sheet (Subtotal 256, Delivery 20, Discount 62)', () => {
    const input = {
      deliveryFee: 20,
      discount: 62,
      items: [
        { id: '1', name: 'ส้มโอ', price: 129 },
        { id: '2', name: 'แนน', price: 127 },
        { id: '3', name: 'ตาล', price: 0 },
      ],
      splitMethod: 'PROPORTIONAL' as const,
      roundToInteger: true,
    };

    const result = calculateSplitBill(input);

    expect(result.subtotal).toBe(256);
    expect(result.grandTotal).toBe(214);
    expect(result.totalCollected).toBe(214);

    const somo = result.members[0]!;
    const nan = result.members[1]!;
    const tarn = result.members[2]!;

    expect(somo.discountAmount).toBe(21);
    expect(somo.finalPrice).toBe(108);
    expect(nan.discountAmount).toBe(21);
    expect(nan.finalPrice).toBe(106);

    // Tarn ordered 0 -> gets 0 discount and pays 0
    expect(tarn.discountAmount).toBe(0);
    expect(tarn.finalPrice).toBe(0);
  });

  it('handles scenario when Delivery Fee is greater than Discount (net delivery fee surcharge)', () => {
    const input = {
      deliveryFee: 50,
      discount: 10,
      items: [
        { id: '1', name: 'เอก', price: 100 },
        { id: '2', name: 'โท', price: 100 },
      ],
      splitMethod: 'PROPORTIONAL' as const,
      roundToInteger: true,
    };

    const result = calculateSplitBill(input);

    expect(result.subtotal).toBe(200);
    expect(result.netDiscount).toBe(-40); // Delivery fee extra 40 baht
    expect(result.grandTotal).toBe(240);

    // Each person pays 100 + 20 extra delivery = 120
    expect(result.members[0]!.finalPrice).toBe(120);
    expect(result.members[0]!.discountAmount).toBe(-20);
    expect(result.members[1]!.finalPrice).toBe(120);
    expect(result.totalCollected).toBe(240);
  });

  it('correctly performs EQUAL split when specified', () => {
    const input = {
      deliveryFee: 10,
      discount: 40,
      items: [
        { id: '1', name: 'A', price: 100 },
        { id: '2', name: 'B', price: 200 },
      ],
      splitMethod: 'EQUAL' as const,
      roundToInteger: true,
    };

    const result = calculateSplitBill(input);
    // net discount = 30. Equal split between 2 members = 15 each.
    expect(result.netDiscount).toBe(30);
    expect(result.members[0]!.discountAmount).toBe(15);
    expect(result.members[0]!.finalPrice).toBe(85);
    expect(result.members[1]!.discountAmount).toBe(15);
    expect(result.members[1]!.finalPrice).toBe(185);
  });

  it('parses quick-paste raw chat text and spreadsheet CSV', () => {
    // 1. Natural chat format
    const chatText = `
      1. กัส 79.5
      2. ตาล 79.5
      โก: 59.5 บาท
      มีน 80
    `;
    const parsedFromChat = parseQuickPasteText(chatText);
    expect(parsedFromChat).toEqual([
      { name: 'กัส', price: 79.5 },
      { name: 'ตาล', price: 79.5 },
      { name: 'โก', price: 59.5 },
      { name: 'มีน', price: 80 },
    ]);

    // 2. CSV spreadsheet format from user sheet
    const csvText = `
      ,#,ชื่อ,ราคา/แก้ว,ปริมาณ %,เหลือส่วนลด,ราคา(ลดแล้ว),,ค่าอาหาร,576
      ,1,กัส,79.5,13.8,10,70,,ค่าส่ง,12
      ,2,ตาล,79.5,13.8,10,70,,ส่วนลด,83
      ,3,โก,59.5,10.33,7,53,,,
    `;
    const parsedFromCsv = parseQuickPasteText(csvText);
    expect(parsedFromCsv).toEqual([
      { name: 'กัส', price: 79.5 },
      { name: 'ตาล', price: 79.5 },
      { name: 'โก', price: 59.5 },
    ]);
  });

  it('generates clean, structured copy text for LINE & KhunThong', () => {
    const input = {
      deliveryFee: 12,
      discount: 83,
      items: [
        { id: '1', name: 'กัส', price: 79.5 },
        { id: '2', name: 'โก', price: 59.5 },
      ],
      splitMethod: 'PROPORTIONAL' as const,
    };

    const result = calculateSplitBill(input);
    const copyText = formatSplitBillCopyText(result, {
      promptPayAccount: '0812345678 (พร้อมเพย์ กัส)',
    });

    expect(copyText).toContain('สรุปยอดหารค่าอาหาร (ตาลหาร)');
    expect(copyText).toContain('ค่าส่ง: +12 บ. | ส่วนลด: -83 บ.');
    expect(copyText).toContain('ยอดโอนแยกรายคน:');
    expect(copyText).toContain('1. กัส:');
    expect(copyText).toContain('2. โก:');
    expect(copyText).toContain('พร้อมเพย์ / บัญชีรับโอน: 0812345678 (พร้อมเพย์ กัส)');
  });

  it('correctly reorders items via reorderArray', () => {
    const list = ['A', 'B', 'C', 'D'];
    // Move 'A' (index 0) to index 2 -> B, C, A, D
    expect(reorderArray(list, 0, 2)).toEqual(['B', 'C', 'A', 'D']);
    // Move 'D' (index 3) to index 0 -> D, A, B, C
    expect(reorderArray(list, 3, 0)).toEqual(['D', 'A', 'B', 'C']);
    // Out of bounds -> returns same list
    expect(reorderArray(list, -1, 2)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('correctly sorts items by price and name', () => {
    const sample = [
      { id: '1', name: 'บอส', price: 50 },
      { id: '2', name: 'กัส', price: 100 },
      { id: '3', name: 'ตาล', price: 75 },
    ];

    const desc = sortSplitItems(sample, 'PRICE_DESC');
    expect(desc.map((i) => i.name)).toEqual(['กัส', 'ตาล', 'บอส']);

    const asc = sortSplitItems(sample, 'PRICE_ASC');
    expect(asc.map((i) => i.name)).toEqual(['บอส', 'ตาล', 'กัส']);
  });

  describe('Stateless Share URL Encoding/Decoding', () => {
    it('encodes bill payload into an ultra-compact Base64URL string without +, /, or =', () => {
      const payload = {
        deliveryFee: 15,
        discount: 60,
        splitMethod: 'PROPORTIONAL' as const,
        promptPay: '0812345678',
        items: [
          { id: '1', name: 'กัส', price: 79.5 },
          { id: '2', name: 'ตาล', price: 79.5 },
          { id: '3', name: 'เอฟ', price: 79.5 },
        ],
      };

      const encoded = encodeSplitBillToUrl(payload);
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
      // Ensure no URL unsafe characters (+, /, =)
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');

      // Decode and check fidelity
      const decoded = decodeSplitBillFromUrl(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded?.deliveryFee).toBe(15);
      expect(decoded?.discount).toBe(60);
      expect(decoded?.splitMethod).toBe('PROPORTIONAL');
      expect(decoded?.promptPay).toBe('0812345678');
      expect(decoded?.items).toHaveLength(3);
      expect(decoded?.items?.[0]?.name).toBe('กัส');
      expect(decoded?.items?.[0]?.price).toBe(79.5);
      expect(decoded?.items?.[1]?.name).toBe('ตาล');
      expect(decoded?.items?.[1]?.price).toBe(79.5);
    });

    it('gracefully decodes strings with spaces or stripped padding (chat app resilient)', () => {
      const payload = {
        deliveryFee: 10,
        discount: 20,
        splitMethod: 'EQUAL' as const,
        promptPay: '0899999999',
        items: [{ id: '1', name: 'ข้าวผัด', price: 65 }],
      };

      const encoded = encodeSplitBillToUrl(payload);
      // Simulate chat app replacing characters or stripping padding
      const withSpaces = encoded.replace(/-/g, ' ');
      const decoded = decodeSplitBillFromUrl(withSpaces);

      expect(decoded).not.toBeNull();
      expect(decoded?.deliveryFee).toBe(10);
      expect(decoded?.discount).toBe(20);
      expect(decoded?.splitMethod).toBe('EQUAL');
      expect(decoded?.items?.[0]?.name).toBe('ข้าวผัด');
      expect(decoded?.items?.[0]?.price).toBe(65);
    });
  });
});
