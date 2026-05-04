# Angular 19 upgrade

This package was upgraded from Angular 18.2.x to Angular 19.2.x to avoid Cloudflare's Angular auto-configuration error requiring Angular 19+.

Changed packages:

- `@angular/*`: `^19.2.0`
- `@angular-devkit/build-angular`: `^19.2.0`
- `@angular/cli`: `^19.2.0`
- `@angular/compiler-cli`: `^19.2.0`
- `typescript`: `~5.8.2`
- `zone.js`: `~0.15.0`

After replacing files in the repo, run locally if you have a lockfile:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

Then commit the updated `package.json` and any regenerated `package-lock.json`.
