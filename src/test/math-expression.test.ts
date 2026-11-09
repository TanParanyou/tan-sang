import { describe, expect, it } from 'vitest';
import { evaluateSimpleMath, hasMathOperators } from '@/lib/utils/math-expression';

describe('Math Expression Evaluator (Safe Inline Math)', () => {
  it('correctly detects math operators', () => {
    expect(hasMathOperators('60+15')).toBe(true);
    expect(hasMathOperators('60-15')).toBe(true);
    expect(hasMathOperators('60*2')).toBe(true);
    expect(hasMathOperators('60/2')).toBe(true);
    expect(hasMathOperators('60×2')).toBe(true);
    expect(hasMathOperators('60÷2')).toBe(true);
    expect(hasMathOperators('79.5')).toBe(false);
    expect(hasMathOperators('abc')).toBe(false);
  });

  it('evaluates basic addition and subtraction', () => {
    expect(evaluateSimpleMath('60+15')).toBe(75);
    expect(evaluateSimpleMath('60 + 10 + 15')).toBe(85);
    expect(evaluateSimpleMath('100 - 25')).toBe(75);
    expect(evaluateSimpleMath('79.5 + 20.5')).toBe(100);
  });

  it('evaluates multiplication and division with operator precedence', () => {
    expect(evaluateSimpleMath('10 + 20 * 2')).toBe(50);
    expect(evaluateSimpleMath('50 - 20 / 2')).toBe(40);
    expect(evaluateSimpleMath('10 × 5')).toBe(50);
    expect(evaluateSimpleMath('100 ÷ 4')).toBe(25);
  });

  it('evaluates expressions with parentheses', () => {
    expect(evaluateSimpleMath('(10 + 20) * 2')).toBe(60);
    expect(evaluateSimpleMath('100 / (2 + 3)')).toBe(20);
  });

  it('handles plain numbers, decimals, and commas gracefully', () => {
    expect(evaluateSimpleMath('79.5')).toBe(79.5);
    expect(evaluateSimpleMath('1,250')).toBe(1250);
    expect(evaluateSimpleMath('1,250 + 50')).toBe(1300);
  });

  it('safely rejects invalid inputs or malicious payloads', () => {
    expect(evaluateSimpleMath('')).toBeNull();
    expect(evaluateSimpleMath('   ')).toBeNull();
    expect(evaluateSimpleMath('alert(1)')).toBeNull();
    expect(evaluateSimpleMath('window.location')).toBeNull();
    expect(evaluateSimpleMath('10 +')).toBeNull();
    expect(evaluateSimpleMath('10 / 0')).toBeNull(); // Division by zero
    expect(evaluateSimpleMath('((10 + 2)')).toBeNull(); // Unmatched paren
  });
});
