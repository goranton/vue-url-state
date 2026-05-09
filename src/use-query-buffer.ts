import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';

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

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }

  return value;
}

function cloneState<T extends Record<string, unknown>>(state: T): T {
  const result = {} as T;

  for (const key of Object.keys(state) as Array<keyof T>) {
    result[key] = cloneValue(state[key]);
  }

  return result;
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
  const draft = ref(cloneState(applied.value)) as Ref<InferQuerySchema<TSchema>>;

  const isDirty = computed(() => !areStatesEqual(draft.value, applied.value));

  watch(query.state, (nextApplied, prevApplied) => {
    if (syncOnExternalChange === 'never') {
      return;
    }

    const shouldSync =
      syncOnExternalChange === 'always' ||
      (syncOnExternalChange === 'when-clean' && areStatesEqual(draft.value, prevApplied));

    if (shouldSync) {
      draft.value = cloneState(nextApplied);
    }
  });

  return {
    draft,
    applied,
    isDirty,
    patch(values) {
      const nextDraft = { ...draft.value };

      for (const key of Object.keys(values) as Array<keyof InferQuerySchema<TSchema>>) {
        nextDraft[key] = cloneValue(values[key]) as InferQuerySchema<TSchema>[typeof key];
      }

      draft.value = nextDraft;
    },
    async apply(patchOptions) {
      await query.patch(draft.value, patchOptions);
      draft.value = cloneState(query.state.value);
    },
    reset() {
      draft.value = cloneState(applied.value);
    },
    clear() {
      draft.value = cloneState(query.deserialize({}));
    },
  };
}
