import isSea from 'is-sea';

export const isAtSea = (latitude: number, longitude: number): boolean =>
  isSea(latitude, longitude);
