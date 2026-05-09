import { describe, expect, it } from 'vitest';

import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  deserializeQuery,
  enumParam,
  numberParam,
  serializeQuery,
  stringParam,
} from './index';

describe('deserializeQuery', () => {
  it('ignores unknown keys', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = deserializeQuery(schema, {
      search: 'anton',
      page: '2',
      utm_source: 'x',
    });

    expect(result).toEqual({
      search: 'anton',
      page: 2,
    });
  });

  it('returns all schema keys', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = deserializeQuery(schema, {});

    expect(result).toEqual({
      search: undefined,
      page: 1,
    });
  });

  it('handles falsy defaults correctly', () => {
    const schema = defineQuerySchema({
      count: numberParam({ defaultValue: 0 }),
      enabled: booleanParam({ defaultValue: false }),
      search: stringParam({ defaultValue: '' }),
    });

    const result = deserializeQuery(schema, {});

    expect(result).toEqual({
      count: 0,
      enabled: false,
      search: '',
    });
  });

  it('numberParam rejects invalid numbers', () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1, integer: true, min: 1 }),
    });

    expect(
      deserializeQuery(schema, {
        page: 'abc',
      }),
    ).toEqual({
      page: 1,
    });

    expect(
      deserializeQuery(schema, {
        page: '0',
      }),
    ).toEqual({
      page: 1,
    });
  });

  it('enumParam rejects invalid values', () => {
    const schema = defineQuerySchema({
      status: enumParam(['active', 'blocked'] as const),
    });

    const result = deserializeQuery(schema, {
      status: 'deleted',
    });

    expect(result).toEqual({
      status: undefined,
    });
  });
});

describe('serializeQuery', () => {
  it('omits undefined values', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = serializeQuery(schema, {
      search: undefined,
      page: undefined,
    });

    expect(result).toEqual({});
  });

  it('cleans primitive defaults by default', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = serializeQuery(schema, {
      search: 'anton',
      page: 1,
    });

    expect(result).toEqual({
      search: 'anton',
    });
  });

  it('keeps defaults when cleanDefaults is false', () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1 }),
    });

    const result = serializeQuery(
      schema,
      {
        page: 1,
      },
      {
        cleanDefaults: false,
      },
    );

    expect(result).toEqual({
      page: '1',
    });
  });

  it('serializes arrays', () => {
    const schema = defineQuerySchema({
      tags: arrayParam(stringParam()),
    });

    const result = serializeQuery(schema, {
      tags: ['vue', 'nuxt'],
    });

    expect(result).toEqual({
      tags: ['vue', 'nuxt'],
    });
  });

  it('omits empty arrays', () => {
    const schema = defineQuerySchema({
      tags: arrayParam(stringParam()),
    });

    const result = serializeQuery(schema, {
      tags: [],
    });

    expect(result).toEqual({});
  });
});
