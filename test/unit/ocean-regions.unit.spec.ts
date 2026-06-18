import {
  OCEAN_REGION_NAMES,
  isOceanRegionName,
} from '../../src/utils/ocean-regions';

describe('ocean-regions', () => {
  describe('OCEAN_REGION_NAMES', () => {
    it('includes the regions used by the client filters', () => {
      expect(OCEAN_REGION_NAMES).toContain('Caribbean Sea');
      expect(OCEAN_REGION_NAMES).toContain('Indian Ocean');
      expect(OCEAN_REGION_NAMES).toContain('Mediterranean Sea');
    });
  });

  describe('isOceanRegionName', () => {
    it('returns true for a known region', () => {
      expect(isOceanRegionName('Caribbean Sea')).toBe(true);
    });

    it('returns false for an unknown region', () => {
      expect(isOceanRegionName('Not A Real Ocean')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isOceanRegionName('')).toBe(false);
    });
  });
});
