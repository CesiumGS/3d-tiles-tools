The `cli.mjs` file in this directory is the entry point for the 3D Tiles tools application when it is installed from an NPM package. It is defined as the entry point via the `bin` property of the main `package.json`.

It only sets up the Node execution environment for the application, as required as of https://docs.npmjs.com/cli/v9/configuring-npm/package-json#bin . Beyond that, it just includes `main.js`. 

It is copied to the `build` directory by the `build-post` script of the `package.json` (similar to https://github.com/microsoft/TypeScript/blob/main/bin )