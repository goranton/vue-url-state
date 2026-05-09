<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
  useQueryBuffer,
  useQueryField,
  useQueryState,
} from '@lib';

const usersQuerySchema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1, integer: true, min: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
  onlyWithErrors: booleanParam(),
});

const query = useQueryState(usersQuerySchema);
const buffer = useQueryBuffer(query);
const searchField = useQueryField(query, 'search', {
  resetOnChange: { page: 1 },
});
const statusField = useQueryField(query, 'status', {
  resetOnChange: { page: 1 },
});
const onlyWithErrorsField = useQueryField(query, 'onlyWithErrors', {
  resetOnChange: { page: 1 },
});

const directSearchInput = ref('');
watch(
  () => query.state.value.search,
  (value) => {
    directSearchInput.value = value ?? '';
  },
  { immediate: true },
);

const directStatusModel = computed({
  get: () => query.state.value.status ?? '',
  set: (value: '' | 'active' | 'blocked' | 'pending') => {
    void query.patch({ status: value === '' ? undefined : value });
  },
});

const directOnlyWithErrorsModel = computed({
  get: () => query.state.value.onlyWithErrors ?? false,
  set: (checked: boolean) => {
    void query.patch({ onlyWithErrors: checked ? true : undefined });
  },
});

const fieldSearchModel = computed({
  get: () => searchField.value ?? '',
  set: (value: string) => {
    searchField.value = value === '' ? undefined : value;
  },
});

const fieldStatusModel = computed({
  get: () => statusField.value ?? '',
  set: (value: '' | 'active' | 'blocked' | 'pending') => {
    statusField.value = value === '' ? undefined : value;
  },
});

const fieldOnlyWithErrorsModel = computed({
  get: () => onlyWithErrorsField.value ?? false,
  set: (checked: boolean) => {
    onlyWithErrorsField.value = checked ? true : undefined;
  },
});

const draftSearchModel = computed({
  get: () => buffer.draft.value.search ?? '',
  set: (value: string) => {
    buffer.patch({ search: value === '' ? undefined : value });
  },
});

const draftStatusModel = computed({
  get: () => buffer.draft.value.status ?? '',
  set: (value: '' | 'active' | 'blocked' | 'pending') => {
    buffer.patch({ status: value === '' ? undefined : value });
  },
});

const draftOnlyWithErrorsModel = computed({
  get: () => buffer.draft.value.onlyWithErrors ?? false,
  set: (checked: boolean) => {
    buffer.patch({ onlyWithErrors: checked ? true : undefined });
  },
});

const stateJson = computed(() => JSON.stringify(query.state.value, null, 2));
const draftJson = computed(() => JSON.stringify(buffer.draft.value, null, 2));
const appliedJson = computed(() => JSON.stringify(buffer.applied.value, null, 2));

async function setSearch(): Promise<void> {
  await query.patch({ search: directSearchInput.value || undefined });
}

async function setPageOne(): Promise<void> {
  await query.patch({ page: 1 });
}

async function removeStatus(): Promise<void> {
  await query.remove(['status']);
}

async function resetQueryState(): Promise<void> {
  await query.reset();
}

async function applyBuffer(): Promise<void> {
  await buffer.apply();
}
</script>

<template>
  <main class="layout">
    <h1>vue-url-state playground</h1>
    <p class="hint">Route: <code>/users</code></p>

    <section class="card">
      <h2>Direct mode (useQueryState)</h2>
      <pre>{{ stateJson }}</pre>

      <div class="controls">
        <label>
          Search
          <input v-model="directSearchInput" type="text" placeholder="Search users..." />
        </label>

        <label>
          Status
          <select v-model="directStatusModel">
            <option value="">(none)</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
            <option value="pending">pending</option>
          </select>
        </label>

        <label class="checkbox">
          <input v-model="directOnlyWithErrorsModel" type="checkbox" />
          onlyWithErrors
        </label>
      </div>

      <div class="buttons">
        <button type="button" @click="setSearch">set search</button>
        <button type="button" @click="setPageOne">set page 1</button>
        <button type="button" @click="removeStatus">remove status</button>
        <button type="button" @click="resetQueryState">reset query</button>
      </div>
    </section>

    <section class="card">
      <h2>Buffered mode (useQueryBuffer)</h2>
      <p class="hint">
        isDirty: <strong>{{ buffer.isDirty.value ? 'true' : 'false' }}</strong>
      </p>

      <div class="grid">
        <div>
          <h3>draft</h3>
          <pre>{{ draftJson }}</pre>
        </div>
        <div>
          <h3>applied</h3>
          <pre>{{ appliedJson }}</pre>
        </div>
      </div>

      <div class="controls">
        <label>
          Draft search
          <input v-model="draftSearchModel" type="text" placeholder="Draft search..." />
        </label>

        <label>
          Draft status
          <select v-model="draftStatusModel">
            <option value="">(none)</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
            <option value="pending">pending</option>
          </select>
        </label>

        <label class="checkbox">
          <input v-model="draftOnlyWithErrorsModel" type="checkbox" />
          draft onlyWithErrors
        </label>
      </div>

      <div class="buttons">
        <button type="button" @click="applyBuffer">apply</button>
        <button type="button" @click="buffer.reset">reset draft</button>
        <button type="button" @click="buffer.clear">clear draft</button>
      </div>
    </section>

    <section class="card">
      <h2>Field mode (useQueryField)</h2>
      <p class="hint">Editing these fields updates URL immediately.</p>
      <pre>{{ stateJson }}</pre>

      <div class="controls">
        <label>
          Search
          <input v-model="fieldSearchModel" type="text" placeholder="Search users..." />
        </label>

        <label>
          Status
          <select v-model="fieldStatusModel">
            <option value="">(none)</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
            <option value="pending">pending</option>
          </select>
        </label>

        <label class="checkbox">
          <input v-model="fieldOnlyWithErrorsModel" type="checkbox" />
          onlyWithErrors
        </label>
      </div>
    </section>
  </main>
</template>

<style scoped>
.layout {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color: #1f2937;
}

.hint {
  color: #4b5563;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.controls {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.buttons button {
  padding: 6px 10px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
}

pre {
  overflow-x: auto;
  margin: 0;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
}

code {
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 4px;
}
</style>
