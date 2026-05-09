import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue';

import { cloneStateValue, isSameValue } from './internal/value';
import type { QueryStateInput } from './query';
import type { InferQuerySchema, QuerySchema } from './types';
import type { QueryPatchOptions, UseQueryStateReturn } from './use-query-state';

export type UseDebouncedQueryFieldOptions<TSchema extends QuerySchema> = QueryPatchOptions & {
  debounce?: number;
  resetOnChange?: QueryStateInput<TSchema>;
  onError?: (error: unknown) => void;
};

export function useDebouncedQueryField<
  TSchema extends QuerySchema,
  TKey extends keyof InferQuerySchema<TSchema>,
>(
  query: UseQueryStateReturn<TSchema>,
  key: TKey,
  options?: UseDebouncedQueryFieldOptions<TSchema>,
): Ref<InferQuerySchema<TSchema>[TKey]> {
  const debounce = options?.debounce ?? 300;
  const patchOptions: QueryPatchOptions | undefined = options
    ? {
        history: options.history,
        preserveUnknown: options.preserveUnknown,
        cleanDefaults: options.cleanDefaults,
      }
    : undefined;

  const fieldRef = ref(cloneStateValue(query.state.value[key])) as Ref<InferQuerySchema<TSchema>[TKey]>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearPendingTimer = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  watch(
    fieldRef,
    (nextValue) => {
      if (isSameValue(nextValue, query.state.value[key])) {
        clearPendingTimer();
        return;
      }

      clearPendingTimer();
      timer = setTimeout(() => {
        const nextPatch = {
          ...(options?.resetOnChange ?? {}),
          [key]: nextValue,
        } as QueryStateInput<TSchema>;

        void query.patch(nextPatch, patchOptions).catch((error) => {
          options?.onError?.(error);
        });
        timer = undefined;
      }, debounce);
    },
    { flush: 'sync' },
  );

  watch(
    () => query.state.value[key],
    (nextValue) => {
      if (!isSameValue(fieldRef.value, nextValue)) {
        fieldRef.value = cloneStateValue(nextValue);
      }
    },
    { flush: 'sync' },
  );

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearPendingTimer();
    });
  }

  return fieldRef;
}
