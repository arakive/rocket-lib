# RocketLib

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the library, run:

```bash
ng build rocket-lib
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:

   ```bash
   cd dist/rocket-lib
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Map

The map component is available from the `rocket-lib/map` entry point. Install `maplibre-gl` as a peer dependency, copy `maplibre-gl/dist/maplibre-gl-worker.mjs` to `assets/maplibre-gl-worker.mjs`, and include its global stylesheet in your application's global styles:

```css
@import 'maplibre-gl/dist/maplibre-gl.css';
```

MapLibre GL JS v6 uses an ESM worker. Configure the copy in an Angular application's `assets` list:

```json
{
  "glob": "maplibre-gl-worker.mjs",
  "input": "node_modules/maplibre-gl/dist",
  "output": "assets"
}
```

`RocketMap` points to that worker by default. Override its `workerUrl` input if the asset is served from a different path; use the same worker URL for every map in the application.

Import `RocketMap` in a standalone component and provide a height with a CSS class or style. The component has a minimum height of 16rem, starts centered at `[0, 0]` with zoom `2`, and shows MapLibre's navigation controls by default.

```ts
import { RocketMap } from 'rocket-lib/map';

@Component({
  imports: [RocketMap],
  template: '<rocket-map style="height: 24rem" [center]="[-3.7038, 40.4168]" [zoom]="11" />',
})
export class LocationView {}
```

Projected layer components can inject `RocketMapRef` and react to its `map` signal. It is `null` until MapLibre initializes and returns to `null` when the map component is destroyed.

`RocketMarker` is a projected directive that adds one GeoJSON point and circle layer. Its coordinates use `[longitude, latitude]` order. Color and radius can also be configured:

```html
<rocket-map style="height: 24rem">
  <rocket-marker [coordinates]="[-3.7038, 40.4168]" />
  <rocket-marker [coordinates]="[-3.6892, 40.4531]" color="#2563eb" [radius]="9" />
</rocket-map>
```
