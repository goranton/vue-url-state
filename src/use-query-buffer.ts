import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';

import { cloneStateObject, cloneStateValue, isSameValue } from './internal/value';
import type { QueryStateInput } from './query';
import type { QueryPatchOptions, UseQueryStateReturn } from './use-query-state';
import type { InferQuerySchema, QuerySchema } from './types';

export type UseQueryBufferSyncMode = 'when-clean' | 'always' | 'never';

export type UseQueryBufferOptions = {
  syncOnExternalChange?: UseQueryBufferSyncMode;
};

export type UseQueryBufferReturn<TSchema extends QuerySchema> = {
  draft: Ref<InferQuerySchema<TSchema>>;
  applied: ComputedRef<InferQuerySchema<TSchema>>;
  isDirty: ComputedRef<boolean>;
  patch: (values: QueryStateInput<TSchema>) => void;
  apply: (options?: QueryPatchOptions) => Promise<void>;
  reset: () => void;
  clear: () => void;
};

function areStatesEqual<TState extends Record<string, unknown>>(left: TState, right: TState): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    if (!isSameValue(left[key], right[key])) {
      return false;
    }
  }

  return true;
}

export function useQueryBuffer<TSchema extends QuerySchema>(
  query: UseQueryStateReturn<TSchema>,
  options: UseQueryBufferOptions = {},
): UseQueryBufferReturn<TSchema> {
  const syncOnExternalChange = options.syncOnExternalChange ?? 'when-clean';
  const applied = computed(() => query.state.value);
  const draft = ref(cloneStateObject(applied.value)) as Ref<InferQuerySchema<TSchema>>;

  const isDirty = computed(() => !areStatesEqual(draft.value, applied.value));

  watch(query.state, (nextApplied, prevApplied) => {
    if (syncOnExternalChange === 'never') {
      return;
    }

    const shouldSync =
      syncOnExternalChange === 'always' ||
      (syncOnExternalChange === 'when-clean' && areStatesEqual(draft.value, prevApplied));

    if (shouldSync) {
      draft.value = cloneStateObject(nextApplied);
    }
  });

  return {
    draft,
    applied,
    isDirty,
    patch(values) {
      const nextDraft = { ...draft.value };

      for (const key of Object.keys(values) as Array<keyof InferQuerySchema<TSchema>>) {
        nextDraft[key] = cloneStateValue(values[key]) as InferQuerySchema<TSchema>[typeof key];
      }

      draft.value = nextDraft;
    },
    async apply(patchOptions) {
      await query.patch(draft.value, patchOptions);
      draft.value = cloneStateObject(query.state.value);
    },
    reset() {
      draft.value = cloneStateObject(applied.value);
    },
    clear() {
      draft.value = cloneStateObject(query.deserialize({}));
    },
  };
}
