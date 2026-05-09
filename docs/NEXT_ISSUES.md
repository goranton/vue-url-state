# Next Issues

## 1) Add subpath exports for pure and Vue entrypoints

Add optional package subpath exports such as:

- `@goranton/vue-url-state/pure`
- `@goranton/vue-url-state/vue`

Goal:
Improve tree-shaking ergonomics for users who only need framework-agnostic helpers.

## 2) Add Nuxt usage guide

Document how to use `@goranton/vue-url-state` in Nuxt apps through Vue Router integration.

Include examples for:

- filters
- pagination
- search
- apply-mode filters

## 3) Add performance benchmarks for large schemas

Add benchmarks for:

- `deserializeQuery`
- `serializeQuery`
- `patchQuery`
- large schemas with 25 / 50 / 100 params
- array-heavy query params
- unknown query param preservation

## 4) Add table filters and pagination examples

Add practical examples showing:

- typed table filters
- pagination
- status tabs
- debounced search
- apply-mode filters with `useQueryBuffer`