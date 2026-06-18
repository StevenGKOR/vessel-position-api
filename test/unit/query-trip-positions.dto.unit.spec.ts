import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryTripPositionsDto } from '../../src/dto/query-trip-positions.dto';

const validateQuery = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(QueryTripPositionsDto, input, {
    enableImplicitConversion: true,
  });
  return validate(dto);
};

describe('QueryTripPositionsDto', () => {
  it('uses defaults for limit and offset', async () => {
    const dto = plainToInstance(QueryTripPositionsDto, {}, {
      enableImplicitConversion: true,
    });
    expect(dto.limit).toBe(50);
    expect(dto.offset).toBe(0);
    expect(await validateQuery({})).toHaveLength(0);
  });

  it('accepts optional date filters and region', async () => {
    const errors = await validateQuery({
      limit: 25,
      offset: 10,
      from: '2017-12-20T00:00:00.000Z',
      to: '2017-12-31T23:59:59.999Z',
      region: 'Caribbean Sea',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects limit below 1', async () => {
    const errors = await validateQuery({ limit: 0 });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects limit above 500', async () => {
    const errors = await validateQuery({ limit: 501 });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects a negative offset', async () => {
    const errors = await validateQuery({ offset: -1 });
    expect(errors.some((e) => e.property === 'offset')).toBe(true);
  });

  it('rejects an unknown region name', async () => {
    const errors = await validateQuery({ region: 'Atlantis Ocean' });
    expect(errors.some((e) => e.property === 'region')).toBe(true);
  });
});
