# useQueryState

`useQueryState(schema)` is the main Vue Router adapter.

```ts
import { useQueryState } from '@goranton/vue-url-state';

const query = useQueryState(schema);
```

## API

- `state`: computed typed state from `route.query`
- `patch(patch, options?)`: updates URL query
- `remove(keys, options?)`: removes selected schema keys
- `reset(options?)`: removes all schema keys

## Behavior defaults

- `preserveUnknown: true`
- `cleanDefaults: true`
- `history: 'replace'`

Use `history: 'push'` when you want browser history entries for updates.
