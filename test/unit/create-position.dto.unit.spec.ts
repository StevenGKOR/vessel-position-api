import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreatePositionDto,
  IsNotInFutureConstraint,
} from '../../src/dto/create-position.dto';

const validateCreatePosition = async (input: unknown) => {
  const dto = plainToInstance(CreatePositionDto, input, {
    enableImplicitConversion: true,
  });
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
};

const constraint = new IsNotInFutureConstraint();

describe('IsNotInFutureConstraint', () => {
  it('accepts a past timestamp', () => {
    expect(constraint.validate('2017-12-20T22:59:12.000Z')).toBe(true);
  });

  it('rejects a future timestamp', () => {
    expect(constraint.validate('2099-01-01T00:00:00.000Z')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(constraint.validate('')).toBe(false);
  });

  it('returns a readable default message', () => {
    expect(constraint.defaultMessage()).toMatch(/future/i);
  });
});

describe('CreatePositionDto', () => {
  const valid = {
    vesselId: 5091,
    receivedTimeUtc: '2017-12-20T22:59:12.000Z',
    latitude: 25.91658,
    longitude: -79.50869,
  };

  it('passes for a valid payload', async () => {
    const errors = await validateCreatePosition(valid);
    expect(errors).toHaveLength(0);
  });

  it('passes when coordinates arrive as numeric strings', async () => {
    const errors = await validateCreatePosition({
      ...valid,
      latitude: '25.91658',
      longitude: '-79.50869',
    });
    expect(errors).toHaveLength(0);
  });

  it('fails when latitude is null', async () => {
    const errors = await validateCreatePosition({ ...valid, latitude: null });
    expect(errors.some((e) => e.property === 'latitude')).toBe(true);
  });

  it('fails when longitude is null', async () => {
    const errors = await validateCreatePosition({ ...valid, longitude: null });
    expect(errors.some((e) => e.property === 'longitude')).toBe(true);
  });

  it('fails for an unknown field', async () => {
    const errors = await validateCreatePosition({ ...valid, extra: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when coordinates are on land', async () => {
    const errors = await validateCreatePosition({
      ...valid,
      latitude: 48.85,
      longitude: 2.35,
    });
    expect(errors.some((e) => e.property === 'longitude')).toBe(true);
  });
});
