# Getting Started

## Install

```bash
npm install @goranton/vue-url-state
```

## Peer dependencies

- Vue 3
- Vue Router 4

## Basic schema

```ts
import {
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
} from '@goranton/vue-url-state';

const usersQuerySchema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked'] as const),
});
```

## Basic useQueryState

```ts
import { useQueryState } from '@goranton/vue-url-state';

const query = useQueryState(usersQuerySchema);

query.state.value;
await query.patch({ search: 'anton', page: 1 });
```

