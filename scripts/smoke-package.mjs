import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  deserializeQuery,
  enumParam,
  numberParam,
  patchQuery,
  serializeQuery,
  stringParam,
  useDebouncedQueryField,
  useQueryBuffer,
  useQueryField,
  useQueryState,
} from '../dist/index.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nReceived: ${actualJson}`);
  }
}

const exportedValues = {
  defineQuerySchema,
  stringParam,
  numberParam,
  enumParam,
  arrayParam,
  booleanParam,
  deserializeQuery,
  serializeQuery,
  patchQuery,
  useQueryState,
  useQueryField,
  useDebouncedQueryField,
  useQueryBuffer,
};

for (const [name, value] of Object.entries(exportedValues)) {
  assert(typeof value === 'function', `Expected "${name}" to be a function export.`);
}

const schema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked']),
});

const deserialized = deserializeQuery(schema, {
  page: '2',
  status: 'active',
});

assertDeepEqual(
  deserialized,
  {
    search: undefined,
    page: 2,
    status: 'active',
  },
  'deserializeQuery smoke check failed.',
);

const serialized = serializeQuery(schema, {
  search: 'anton',
  page: 1,
});

assertDeepEqual(
  serialized,
  {
    search: 'anton',
  },
  'serializeQuery smoke check failed.',
);

console.log('Package smoke test passed.');
