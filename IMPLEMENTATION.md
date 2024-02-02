# 3D Tiles Tools Implementation Notes

Parts of the current implementation may still change. This page is only a short description of the overall structure.

## Internal notes

The original 3D Tiles Tools have been converted into a monorepo with different packages.

The packages are 

- [`base`](./packages/base/) - Basic utility classes shared by nearly all other packages
- [`structure`](./packages/structure/) - Typescript types for the elements of a 3D Tiles tileset JSON
- [`ktx`](./packages/structure/) - A convenience wrapper around the BinomialLLC basis (KTX) encoder WASM module
- [`gltf-extensions`](./packages/gltf-extensions/) - Implementations of the Cesium glTF extensions based on glTF-Transform
- [`metadata`](./packages/metadata/) - Basic classes for the implementation of the 3D Metadata Specification
- [`tilesets`](./packages/tilesets/) - Classes for handling 3D Tiles tileset data (including tile content and tileset packages)
- [`tools`](./packages/tools/) - The main classes implementing the 3D Tiles Tools functionalities
- [`cli`](./packages/cli/) - The main command line application for the 3D Tiles tools
- [`spec-helpers`](./packages/spec-helpers/) - Internal utility classes for running the specs (unit tests)

### Structure of `package.json`

From the perspective of the top-level `package.json`, each package is a _workspace_. This means that each package has its own `package.json` that declares its dependencies and basic build- and test commands. The top-level `package.json` only declares
```
  "workspaces": [
    "packages/*"
  ],
```
which allows certain operations (like packaging) to be run in a "bulk" fashion on all the packages at once.

It is important to run `npm install` at the root directory after cloning the repo (preferably even before opening VSCode). When workspaces are present, then this will establish one symbolic link for each package in the `node_modules` repository, making sure that "the packages know each other". 

### Structure of `tsconfig.json`

The goal of splitting the 3D Tiles Tools into modules originally was to create ESM modules. However, due to limited interoperability of ESM modules and CommonJS projects, it was decided to offer the tools as CommonJS modules instead. 

- The `package.json` of each package declares `"type": "commonjs"`
- The `compilerOptions` of the `tsconfig.json` declares `"module": "CommonJS"`

The root-level `tsconfig.json` defines the common settings. Each package contains further `tsconfig.json` files that _inherit_ from the root-level one (See [TSConfig `extends`](https://www.typescriptlang.org/tsconfig#extends)).

The structure of the project and its packages is reflected in the `tsconfig.json` files via _Project References_ (See [TypeScript: 'Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)). Each `tsconfig.json` in the packages has to declare
```
  "compilerOptions": {
    "declaration": true,
    "composite": true,
  },
```
so that the respective `tsconfig.json` may be used via a Project Reference.

Each package contains three `tsconfig.json` files: 
- `<package>/tsconfig.json`: The main config file for the package
  - This may add package-specific settings in the `compilerOptions`
  - Beyond that, it only refers to the other ones:
- `<package>/src/tsconfig.json`: The configuration for the actual source code of the package
- `<package>/specs/tsconfig.json`: The configuration for the specs (unit tests) of the package
  - This refers to the `src` configuration file as a "dependency"

The reason for separating the `tsconfig.json` file for the `src` and the `specs` is to have different build output directories for them, to make sure that `src` cannot not import anything from `specs`, and the final, distributed package can contain only the build output of `src`. (NOTE: Right now, it contains both. This is not critical, but the `specs` build output might be omitted from the packages in the future).

The root-level `tsconfig` file refers to the `tsconfig.json` file of the `src`- and `specs` folders:
```
  "references": [
    { "path": "./packages/base/src/tsconfig.json" },
    { "path": "./packages/base/specs/tsconfig.json" },
    ...
  ]
```

They are listed there in the order in which they are built:

- Build all `src` part for each package
- Build the `spec-helpers` (which depends on some of the `src` outputs)
- Build the `specs` part for each package (which often depends on the `spec-helpers`)

### Tests

Running the tests with Jasmine eventually looks simple: Jasmine has to be started with

`npx ts-node node_modules/jasmine/bin/jasmine.js ...`

> Anecdotal note: With the initial ESM approach, the call would have been
>
> `ts-node --esm node_modules/jasmine/bin/jasmine.js ...`
>
> but this breaks with certain Node.js versions - see https://github.com/TypeStrong/ts-node/issues/2094 .
>
> To work around this, the call had to be 
> 
> `node --loader ts-node/esm node_modules/jasmine/bin/jasmine.js ...`
>
> This emitted `ExperimentalWarning` messages, but worked.
>
> With CommonJS, all this does not matter.

One caveat is:

- The test data is stored in `./specs/data` (because parts of it is shared by multiple packages)
- It should be possible to run _all_ tests from the _root_ directory
- It should be possible to run the tests of a _single_ package from the directory of that package

So in order to resolve the test data in both cases:
- The `jasmine.json` config files in the packages refer to a `helper` that sets `process.env.SPECS_DATA_BASE_DIRECTORY = "../../specs/data";` (whereas the default in the top-level case is just `"./specs/data"`)
- This environment variable is picked up by the `/spec-helpers/SpecHelpers` class and returned as the "base" directory for resolving data

### Coverage

The coverage is now computed with `c8` from https://github.com/bcoe/c8 

> Anecdotal note: 
> 
> The coverage originally had been checked with `nyc`, but apparently, ESM modules are not supported by `nyc` (see https://github.com/istanbuljs/nyc/issues/1287 ). 
> So `c8` was chosen as a solution that also worked with ESM. It is a "drop-in-replacement" of `nyc`, so there is no reason to go back to `nyc` for now (even though the tools are now packaged as CommonJS modules).

### Even More Internal Notes:

- There are places where the `/// <reference path=" ... " />` syntax is used, in order to point TypeScript to the right type information (see [TypeScript: Triple-Slash Directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)). This appears to be necessary for `gltf-pipeline` and `gltfpack` dependencies, which do not have associated type information. This is strongly discouraged, and should instead be solved by specifying proper `typeRoots` in the `compilerOptions` of the respective `tsconfig.json`. Maybe there is a way to tweak this so that it actually _works_ ...
- There seem to be a few differences btween _compiling_ code (with `tsc`) and _executing_ code (with `npx ts-node`) when it comes to ~"module and type resolution". Sometimes types are not found here and there. There are rumours in hundreds of issues related to that. Sometimes the [`ts-node` `--files` argument](https://typestrong.org/ts-node/docs/options/#files) (which is completely unrelated to the `files` in `tsconfig.json`, although it also refers to this property) seemed to help. Sometimes the `tsconfig-paths` package from https://www.npmjs.com/package/tsconfig-paths seemed to help. Maybe some of these approaches will have to be investigated when a specific problem comes up.


## API Definition

The API definition is tracked with https://api-extractor.com

After running `npm install`, the API documentation can be created with `npm run docs`.

Generating the documentation consists of two steps (which are subcommands of the `docs` command), namely
- extracting the API definitions from the build output
- generating the markdown from the API definitions.

The first step is performed by running `api-extractor` for each package individually. This happens from the top-level package JSON file, using the `--workspaces` parameter. The surface API information will be written into `./etc/<package>.md`. These files capture the public API, and changes in the public API will cause a warning to be printed

> Warning: You have changed the public API signature for this project.

The API definition files are tracked with Git, so changes in these files should be reviewed carefully.

After extracting the API definition files, `api-documenter` is used to generate the actual API documentation markdown files, which will be written into the `./build/docs` directory.


## Release Process

- Prepare the actual release:
  - Update `CHANGES.md`
  - Update the version number in `package.json`

- Generate the tarball for the release:  
  
  `npm run package` 

  This will run the required scripts from the `package.json`:
    - Clean the build output folder
    - Prepare the package: 
      - Perform linting
      - Check formatting
      - Build (compile TypeScript to JavaScript)
      - Run the unit tests
      - Generate the documentation
      - Update the third-party information
    - Package the build output folder into a TAR file

- Verify the contents of the resulting TAR file. If there are unwanted files, add these files to `.npmignore` and re-generate the tarball

- Create a git tag for the version and push it:
 
  `git tag -a v1.2.3 -m "Release of version 1.2.3"`
  
  `git push origin v1.2.3`

- Publish the package:
  
  `npm publish`


### Build Scripts

The build scripts that are used for the release process are documented with `about:`_`<step>`_ in the `package.json` file. Each of these comments indicates the goal and preconditions for running the respective step. The structure of these scripts is often organized hierarchically:

- `docs`
  - `build`
  - `docs-generate`
    - `docs-prepare-directory`
    - `docs-extract-api`,
    - `docs-generate-markdown`,

 The intention is to make sure that each "top-level" (single-word) script can be executed without any preconditions (athough this pattern may not be applied for all steps). Intermediate steps can be executed manually or as part of other steps when it is ensured that the respective preconditions are met.

The following `devDependencies` are *only* used for the implementation of the build process:

- `mkdirp` - To generate the `etc` output directory for the API definition file (if it does not exist yet)
- `del-cli` - To delete the contents of the `build` output folder
- `copyfiles` - To copy the `bin/main` file to the build folder (see `bin/README.md` for details)


