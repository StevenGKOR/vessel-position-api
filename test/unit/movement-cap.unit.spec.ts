import { distanceKm } from '../../src/utils/position-movement';

describe('distanceKm — antipodal and long hops', () => {
  it('returns roughly half the earth circumference for antipodal points', () => {
    const km = distanceKm(0, 0, 0, 180);
    expect(km).toBeGreaterThan(19_000);
    expect(km).toBeLessThan(21_000);
  });

  it('returns positive distances for separated surface points', () => {
    const samples: [number, number, number, number][] = [
      [0, 0, 0, 180],
      [90, 0, -90, 0],
      [25.91658, -79.50869, 36.0, 16.0],
      [30, -40, 10, 80],
    ];

    for (const [lat1, lon1, lat2, lon2] of samples) {
      expect(distanceKm(lat1, lon1, lat2, lon2)).toBeGreaterThan(0);
    }
  });
});
