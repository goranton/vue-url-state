import { computed, type ComputedRef } from 'vue';
import {
  useRoute,
  useRouter,
  type RouteLocationNormalizedLoaded,
  type Router,
} from 'vue-router';

import {
  deserializeQuery,
  patchQuery,
  removeQueryKeys,
  resetQuery,
  serializeQuery,
  type QueryMutationOptions,
  type QueryObject,
  type QueryStateInput,
  type SerializeQueryOptions,
} from './query';
import type { InferQuerySchema, QuerySchema } from './types';

export type QueryNavigationMode = 'replace' | 'push';

export type QueryPatchOptions = QueryMutationOptions & {
  history?: QueryNavigationMode;
};

export type UseQueryStateOptions = QueryMutationOptions & {
  history?: QueryNavigationMode;
  router?: Router;
  route?: RouteLocationNormalizedLoaded;
};

export type UseQueryStateReturn<TSchema extends QuerySchema> = {
  state: ComputedRef<InferQuerySchema<TSchema>>;
  raw: ComputedRef<QueryObject>;
  patch: (patch: QueryStateInput<TSchema>, options?: QueryPatchOptions) => Promise<void>;
  remove: (
    keys: readonly (keyof InferQuerySchema<TSchema>)[],
    options?: Pick<QueryPatchOptions, 'history' | 'preserveUnknown'>,
  ) => Promise<void>;
  reset: (options?: Pick<QueryPatchOptions, 'history' | 'preserveUnknown'>) => Promise<void>;
  serialize: (state: QueryStateInput<TSchema>, options?: SerializeQueryOptions) => QueryObject;
  deserialize: (query: QueryObject) => InferQuerySchema<TSchema>;
};

function normalizeLocationQuery(query: RouteLocationNormalizedLoaded['query']): QueryObject {
  const result: QueryObject = {};

  for (const key of Object.keys(query)) {
    const value = query[key];

    if (Array.isArray(value)) {
      const normalizedArray = value.filter((entry): entry is string => entry !== null);
      result[key] = normalizedArray.length > 0 ? normalizedArray : undefined;
      continue;
    }

    result[key] = value === null ? undefined : value;
  }

  return result;
}

async function navigateQuery(
  router: Router,
  query: QueryObject,
  history: QueryNavigationMode,
): Promise<void> {
  const navigate = history === 'push' ? router.push.bind(router) : router.replace.bind(router);
  await navigate({ query });
}

export function useQueryState<TSchema extends QuerySchema>(
  schema: TSchema,
  options: UseQueryStateOptions = {},
): UseQueryStateReturn<TSchema> {
  const router = options.router ?? useRouter();
  const route = options.route ?? useRoute();

  const raw = computed<QueryObject>(() => normalizeLocationQuery(route.query));
  const state = computed<InferQuerySchema<TSchema>>(() => deserializeQuery(schema, raw.value));

  const patch: UseQueryStateReturn<TSchema>['patch'] = async (nextPatch, callOptions = {}) => {
    const nextQuery = patchQuery(schema, raw.value, nextPatch, {
      cleanDefaults: callOptions.cleanDefaults ?? options.cleanDefaults,
      preserveUnknown: callOptions.preserveUnknown ?? options.preserveUnknown,
    });

    const history = callOptions.history ?? options.history ?? 'replace';
    await navigateQuery(router, nextQuery, history);
  };

  const remove: UseQueryStateReturn<TSchema>['remove'] = async (keys, callOptions = {}) => {
    const nextQuery = removeQueryKeys(schema, raw.value, keys, {
      preserveUnknown: callOptions.preserveUnknown ?? options.preserveUnknown,
    });

    const history = callOptions.history ?? options.history ?? 'replace';
    await navigateQuery(router, nextQuery, history);
  };

  const reset: UseQueryStateReturn<TSchema>['reset'] = async (callOptions = {}) => {
    const nextQuery = resetQuery(schema, raw.value, {
      preserveUnknown: callOptions.preserveUnknown ?? options.preserveUnknown,
    });

    const history = callOptions.history ?? options.history ?? 'replace';
    await navigateQuery(router, nextQuery, history);
  };

  return {
    state,
    raw,
    patch,
    remove,
    reset,
    serialize: (inputState, serializeOptions) => serializeQuery(schema, inputState, serializeOptions),
    deserialize: (query) => deserializeQuery(schema, query),
  };
}
