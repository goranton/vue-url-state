import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue';

import type { QueryStateInput } from './query';
import type { InferQuerySchema, QuerySchema } from './types';
import type { QueryPatchOptions, UseQueryStateReturn } from './use-query-state';

export type UseDebouncedQueryFieldOptions<TSchema extends QuerySchema> = QueryPatchOptions & {
  debounce?: number;
  resetOnChange?: QueryStateInput<TSchema>;
  onError?: (error: unknown) => void;
};

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }

  return value;
}

function isSameValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    for (let i = 0; i < left.length; i += 1) {
      if (!Object.is(left[i], right[i])) {
        return false;
      }
    }

    return true;
  }

  return Object.is(left, right);
}

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

  const fieldRef = ref(cloneValue(query.state.value[key])) as Ref<InferQuerySchema<TSchema>[TKey]>;
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
        fieldRef.value = cloneValue(nextValue);
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
