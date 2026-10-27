import { describe, expect, it } from 'vitest';
import { getRandomDish, RANDOM_DISHES } from '@/features/food-randomizer/random-dishes';

describe('Food Randomizer (สุ่มอาหาร)', () => {
  it('should have at least 100 dishes in the dataset', () => {
    expect(RANDOM_DISHES.length).toBeGreaterThanOrEqual(100);
  });

  it('should have valid non-empty Thai names for all dishes', () => {
    for (const dish of RANDOM_DISHES) {
      expect(dish.nameTh.trim().length).toBeGreaterThan(0);
      if (dish.nameEn) {
        expect(dish.nameEn.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('should not contain duplicate Thai dish names', () => {
    const names = RANDOM_DISHES.map((d) => d.nameTh.trim());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(RANDOM_DISHES.length);
  });

  it('should return a dish from the list when calling getRandomDish()', () => {
    const picked = getRandomDish();
    expect(picked).toBeDefined();
    expect(RANDOM_DISHES.some((d) => d.nameTh === picked.nameTh)).toBe(true);
  });

  it('should not return the excluded dish if other choices exist', () => {
    const first = RANDOM_DISHES[0];
    expect(first).toBeDefined();
    if (!first) return;
    for (let i = 0; i < 20; i++) {
      const next = getRandomDish(first.nameTh);
      expect(next.nameTh).not.toBe(first.nameTh);
    }
  });
});
