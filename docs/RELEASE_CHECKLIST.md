# Release Checklist

## Before release

- `npm install`
- `npm run check`
- `npm run playground`
- Manually test playground scenarios
- Confirm `npm pack --dry-run` contents
- Confirm `package.json` metadata
- Confirm README examples
- Confirm `LICENSE`
- Confirm CI is green

## Manual publishing notes

- Package name: `@goranton/vue-url-state`
- Ensure `private: true` is removed before publishing
- Set package version
- Run `npm publish --access public`

Do not automate publishing in this repository yet.