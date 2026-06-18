import { isAtSea } from '../../src/utils/land-water';

describe('isAtSea', () => {
  it('returns true for a point in open ocean', () => {
    expect(isAtSea(30, -40)).toBe(true);
  });

  it('returns true for the sample offshore Miami position', () => {
    expect(isAtSea(25.91658, -79.50869)).toBe(true);
  });

  it('returns false for an inland point', () => {
    expect(isAtSea(39, -98)).toBe(false);
    expect(isAtSea(48.85, 2.35)).toBe(false);
  });
});
