import { describe, expect, it } from 'vitest';

import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  deserializeQuery,
  enumParam,
  numberParam,
  patchQuery,
  removeQueryKeys,
  resetQuery,
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

describe('query mutation helpers', () => {
  it('patchQuery merges patch into current typed state', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = patchQuery(
      schema,
      {
        search: 'old',
        page: '2',
      },
      {
        search: 'anton',
      },
    );

    expect(result).toEqual({
      search: 'anton',
      page: '2',
    });
  });

  it('patchQuery preserves unknown keys by default', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = patchQuery(
      schema,
      {
        search: 'old',
        page: '2',
        utm_source: 'x',
      },
      {
        search: 'anton',
      },
    );

    expect(result).toEqual({
      search: 'anton',
      page: '2',
      utm_source: 'x',
    });
  });

  it('patchQuery removes default values when cleanDefaults is true', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = patchQuery(
      schema,
      {
        search: 'old',
        page: '2',
        utm_source: 'x',
      },
      {
        search: 'anton',
        page: 1,
      },
    );

    expect(result).toEqual({
      search: 'anton',
      utm_source: 'x',
    });
  });

  it('patchQuery keeps default values when cleanDefaults is false', () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1 }),
    });

    const result = patchQuery(
      schema,
      {
        page: '2',
      },
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

  it('patchQuery removes schema key when patched value is undefined', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = patchQuery(
      schema,
      {
        search: 'anton',
        page: '2',
        utm_source: 'x',
      },
      {
        page: undefined,
      },
    );

    expect(result).toEqual({
      search: 'anton',
      utm_source: 'x',
    });
  });

  it('patchQuery drops unknown keys when preserveUnknown is false', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = patchQuery(
      schema,
      {
        search: 'old',
        page: '2',
        utm_source: 'x',
      },
      {
        search: 'anton',
      },
      {
        preserveUnknown: false,
      },
    );

    expect(result).toEqual({
      search: 'anton',
      page: '2',
    });
  });

  it('removeQueryKeys removes selected schema keys and preserves unknown keys', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = removeQueryKeys(
      schema,
      {
        search: 'anton',
        page: '2',
        utm_source: 'x',
      },
      ['search'],
    );

    expect(result).toEqual({
      page: '2',
      utm_source: 'x',
    });
  });

  it('removeQueryKeys drops unknown keys when preserveUnknown is false', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = removeQueryKeys(
      schema,
      {
        search: 'anton',
        page: '2',
        utm_source: 'x',
      },
      ['search'],
      {
        preserveUnknown: false,
      },
    );

    expect(result).toEqual({
      page: '2',
    });
  });

  it('resetQuery removes all schema keys and preserves unknown keys', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = resetQuery(schema, {
      search: 'anton',
      page: '2',
      utm_source: 'x',
    });

    expect(result).toEqual({
      utm_source: 'x',
    });
  });

  it('resetQuery returns empty object when preserveUnknown is false', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const result = resetQuery(
      schema,
      {
        search: 'anton',
        page: '2',
        utm_source: 'x',
      },
      {
        preserveUnknown: false,
      },
    );

    expect(result).toEqual({});
  });

  it('does not mutate input objects', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });

    const currentQuery = {
      search: 'old',
      page: '2',
      utm_source: 'x',
    };
    const patch = {
      search: 'anton' as const,
      page: 1 as number | undefined,
    };
    const keys = ['search'] as const;

    const currentBefore = { ...currentQuery };
    const patchBefore = { ...patch };
    const keysBefore = [...keys];

    patchQuery(schema, currentQuery, patch);
    removeQueryKeys(schema, currentQuery, keys);
    resetQuery(schema, currentQuery);

    expect(currentQuery).toEqual(currentBefore);
    expect(patch).toEqual(patchBefore);
    expect(keys).toEqual(keysBefore);
  });
});
