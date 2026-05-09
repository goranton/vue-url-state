# vue-url-state

Type-safe URL query state management for Vue and Nuxt.

`vue-url-state` helps manage filters, pagination, tabs, and other page state through typed URL query params.

## Why

Working with query params directly usually creates the same issues across pages:

- query params are string-based by default
- filter state gets duplicated between URL state and component state
- `router.replace`/`router.push` logic is repeated everywhere
- apply-mode filters require extra local buffering code
- default values and URL cleanup are easy to get wrong

## Install

```bash
npm install vue-url-state
pnpm add vue-url-state
yarn add vue-url-state
```

The package is not published yet while `package.json` has `private: true`. Install commands are preview usage for when it is published.

## Basic Schema

```ts
import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
} from 'vue-url-state';

const usersQuerySchema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
  onlyWithErrors: booleanParam(),
});
```

Inferred state type:

```ts
{
  search: string | undefined;
  page: number;
  status: 'active' | 'blocked' | 'pending' | undefined;
  tags: string[] | undefined;
  onlyWithErrors: boolean | undefined;
}
```

## useQueryState

```ts
import { useQueryState } from 'vue-url-state';

const query = useQueryState(usersQuerySchema);

query.state.value;
await query.patch({ search: 'anton', page: 1 });
await query.remove(['status']);
await query.reset();
```

- `state` is computed from `route.query`
- `patch()` updates URL query values
- default history mode is `replace`
- unknown query params are preserved by default
- default values are cleaned from URL by default

## useQueryField

```ts
import { useQueryField, useQueryState } from 'vue-url-state';

const query = useQueryState(usersQuerySchema);

const search = useQueryField(query, 'search', {
  resetOnChange: {
    page: 1,
  },
});

search.value = 'anton';
```

- `useQueryField` returns a writable computed ref for a single field.
- It is useful for `v-model` bindings in forms.
- Setting the field updates URL state via `query.patch()`.
- `resetOnChange` can reset related fields (for example `page: 1` when search changes).
- For awaited and fully controlled updates, use `query.patch()` directly.

## useDebouncedQueryField

```ts
import { useDebouncedQueryField, useQueryState } from 'vue-url-state';

const query = useQueryState(usersQuerySchema);

const search = useDebouncedQueryField(query, 'search', {
  debounce: 300,
  resetOnChange: {
    page: 1,
  },
});

search.value = 'anton';
```

- `useDebouncedQueryField` returns a local `Ref`.
- It is useful for search inputs and similar frequently changing fields.
- The local value updates immediately.
- URL updates happen only after the debounce delay.
- `resetOnChange` can reset related fields (for example `page: 1`).
- Debounce is intentionally not part of `useQueryState()`.
- For immediate updates, use `useQueryField()`.
- For explicit Apply-button flows, use `useQueryBuffer()`.

## useQueryBuffer

```ts
import { useQueryBuffer, useQueryState } from 'vue-url-state';

const query = useQueryState(usersQuerySchema);
const buffer = useQueryBuffer(query);

buffer.patch({ search: 'anton' });

if (buffer.isDirty.value) {
  await buffer.apply();
}
```

- draft changes stay local and do not update URL immediately
- `apply()` writes the draft to URL through `query.patch()`
- `reset()` discards local draft edits
- `clear()` resets draft to default/empty state

## Pure Helpers

```ts
import { deserializeQuery, serializeQuery } from 'vue-url-state';

const state = deserializeQuery(usersQuerySchema, {
  page: '2',
  status: 'active',
});

const raw = serializeQuery(usersQuerySchema, {
  search: 'anton',
  page: 1,
});
```

## API

- **Schema:** `defineQuerySchema`
- **Params:** `stringParam`, `numberParam`, `booleanParam`, `enumParam`, `arrayParam`
- **Pure helpers:** `deserializeQuery`, `serializeQuery`, `patchQuery`, `removeQueryKeys`, `resetQuery`
- **Vue composables:** `useQueryState`, `useQueryField`, `useDebouncedQueryField`, `useQueryBuffer`

## Defaults

- Params without `defaultValue` infer as `T | undefined`.
- Params with `defaultValue` infer as `T`.
- `cleanDefaults` removes default values from URL by default.
- `preserveUnknown` keeps unknown query params by default.

## Status

- Early-stage project.
- Built for Vue 3 + Vue Router 4.
- Nuxt should work through Vue Router integration, but there is no Nuxt-specific module yet.
- API may still change before `1.0`.

