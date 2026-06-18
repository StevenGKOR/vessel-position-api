import { OCEAN_REGION_NAMES } from '../../src/utils/ocean-regions';

describe('OCEAN_REGION_NAMES', () => {
  it('lists every region exactly once', () => {
    const unique = new Set(OCEAN_REGION_NAMES);
    expect(unique.size).toBe(OCEAN_REGION_NAMES.length);
  });

  it('contains all major ocean basins used in filtering', () => {
    expect(OCEAN_REGION_NAMES).toEqual(
      expect.arrayContaining([
        'North Atlantic',
        'South Atlantic',
        'North Pacific',
        'South Pacific',
        'Indian Ocean',
        'Mediterranean Sea',
        'Caribbean Sea',
        'Gulf of Mexico',
      ]),
    );
  });

  it('does not include empty or duplicate-like entries', () => {
    for (const name of OCEAN_REGION_NAMES) {
      expect(name.trim()).toBe(name);
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
