import { computed, type WritableComputedRef } from 'vue';

import type { QueryStateInput } from './query';
import type { InferQuerySchema, QuerySchema } from './types';
import type { QueryPatchOptions, UseQueryStateReturn } from './use-query-state';

export type UseQueryFieldOptions<TSchema extends QuerySchema> = QueryPatchOptions & {
  resetOnChange?: QueryStateInput<TSchema>;
  onError?: (error: unknown) => void;
};

export function useQueryField<
  TSchema extends QuerySchema,
  TKey extends keyof InferQuerySchema<TSchema>,
>(
  query: UseQueryStateReturn<TSchema>,
  key: TKey,
  options?: UseQueryFieldOptions<TSchema>,
): WritableComputedRef<InferQuerySchema<TSchema>[TKey]> {
  const patchOptions: QueryPatchOptions | undefined = options
    ? {
        history: options.history,
        preserveUnknown: options.preserveUnknown,
        cleanDefaults: options.cleanDefaults,
      }
    : undefined;

  return computed({
    get: () => query.state.value[key],
    set: (value) => {
      const nextPatch = {
        ...(options?.resetOnChange ?? {}),
        [key]: value,
      } as QueryStateInput<TSchema>;

      void query.patch(nextPatch, patchOptions).catch((error) => {
        options?.onError?.(error);
      });
    },
  });
}
