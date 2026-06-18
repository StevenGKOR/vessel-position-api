import {
  MAX_VESSEL_SPEED_KNOTS,
  coordinatesMatch,
  distanceKm,
  maxAllowedDistanceKm,
  validateMovement,
} from '../../src/utils/position-movement';

const KNOTS_TO_KM_PER_HOUR = 1.852;

describe('position-movement', () => {
  describe('distanceKm', () => {
    it('returns 0 for the same point', () => {
      expect(distanceKm(25.0, -80.0, 25.0, -80.0)).toBe(0);
    });

    it('returns a positive distance for separated points', () => {
      const km = distanceKm(25.91658, -79.50869, 26.0, -80.0);
      expect(km).toBeGreaterThan(40);
      expect(km).toBeLessThan(150);
    });

    it('is symmetric regardless of point order', () => {
      const forward = distanceKm(25.0, -80.0, 30.0, -75.0);
      const reverse = distanceKm(30.0, -75.0, 25.0, -80.0);
      expect(forward).toBeCloseTo(reverse, 5);
    });
  });

  describe('coordinatesMatch', () => {
    it('treats nearly identical coordinates as a match', () => {
      expect(
        coordinatesMatch(
          { latitude: 25.91658, longitude: -79.50869 },
          { latitude: 25.916580001, longitude: -79.508690001 },
        ),
      ).toBe(true);
    });

    it('treats clearly different coordinates as not a match', () => {
      expect(
        coordinatesMatch(
          { latitude: 25.91658, longitude: -79.50869 },
          { latitude: 40, longitude: 10 },
        ),
      ).toBe(false);
    });
  });

  describe('maxAllowedDistanceKm', () => {
    it('scales linearly with elapsed time at the configured vessel speed', () => {
      expect(maxAllowedDistanceKm(1)).toBeCloseTo(
        MAX_VESSEL_SPEED_KNOTS * KNOTS_TO_KM_PER_HOUR,
        5,
      );
      expect(maxAllowedDistanceKm(24)).toBeCloseTo(
        MAX_VESSEL_SPEED_KNOTS * KNOTS_TO_KM_PER_HOUR * 24,
        5,
      );
      expect(maxAllowedDistanceKm(720)).toBeCloseTo(
        MAX_VESSEL_SPEED_KNOTS * KNOTS_TO_KM_PER_HOUR * 720,
        5,
      );
    });
  });

  describe('validateMovement', () => {
    const base = {
      latitude: 25.91658,
      longitude: -79.50869,
      receivedTimeUtc: '2017-12-20T22:59:12.000Z',
    };

    it('returns null for a short hop within the cap', () => {
      expect(
        validateMovement(base, {
          ...base,
          latitude: 26.0,
          longitude: -80.0,
          receivedTimeUtc: '2017-12-20T23:59:12.000Z',
        }),
      ).toBeNull();
    });

    it('returns null for a long ocean crossing within the speed-based limit', () => {
      expect(
        validateMovement(
          {
            latitude: 30,
            longitude: -40,
            receivedTimeUtc: '2017-12-20T12:00:00.000Z',
          },
          {
            latitude: 10,
            longitude: 80,
            receivedTimeUtc: '2017-12-26T12:00:00.000Z',
          },
        ),
      ).toBeNull();
    });

    it('rejects a long hop that exceeds the speed-based limit', () => {
      expect(
        validateMovement(
          {
            latitude: 30,
            longitude: -40,
            receivedTimeUtc: '2017-12-20T12:00:00.000Z',
          },
          {
            latitude: 10,
            longitude: 80,
            receivedTimeUtc: '2017-12-21T12:00:00.000Z',
          },
        ),
      ).toMatch(/could not travel/i);
    });

    it('returns null when timestamps are invalid', () => {
      expect(
        validateMovement(base, {
          ...base,
          receivedTimeUtc: 'not-a-date',
        }),
      ).toBeNull();
    });

    it('returns null when timestamps are identical', () => {
      expect(validateMovement(base, { ...base })).toBeNull();
    });
  });
});
