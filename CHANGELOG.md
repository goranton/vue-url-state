# Changelog

## 0.1.0 - 2026-05-09

### Added

- Type-safe query schema definition with `defineQuerySchema()`.
- Param builders: `stringParam()`, `numberParam()`, `booleanParam()`, `enumParam()`, `arrayParam()`.
- Default-aware state inference.
- Pure helpers: `deserializeQuery()`, `serializeQuery()`, `patchQuery()`, `removeQueryKeys()`, `resetQuery()`.
- Vue Router integration through `useQueryState()`.
- Field helpers: `useQueryField()` and `useDebouncedQueryField()`.
- Apply-mode buffering through `useQueryBuffer()`.
- Runtime tests, type-level tests, package smoke test, and playground.

### Notes

- This is an early 0.x release.
- API may still change before 1.0.
