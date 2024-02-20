# 3D Tiles Tools Implementation Notes

Parts of the current implementation may still change. This page is only a short description of the overall structure.

## Internal notes

The source code folder contains the sources in a form that is organized so that each subdirectory can easily become a "workspace"/"package" in a monorepo. This is the result of https://github.com/CesiumGS/3d-tiles-tools/pull/64 , even though the current state does not use workspaces yet.

The subdirectories are 

- `base` - Basic utility classes shared by nearly all other packages
- `structure` - Typescript types for the elements of a 3D Tiles tileset JSON
- `ktx` - A convenience wrapper around the BinomialLLC basis (KTX) encoder WASM module
- `gltf-extensions` - Implementations of the Cesium glTF extensions based on glTF-Transform
- `metadata` - Basic classes for the implementation of the 3D Metadata Specification
- `tilesets` - Classes for handling 3D Tiles tileset data (including tile content and tileset packages)
- `tools` - The main classes implementing the 3D Tiles Tools functionalities
- `cli` - The main command line application for the 3D Tiles tools
- `spec-helpers` - Internal utility classes for running the specs (unit tests)


### Tests

Running the tests with Jasmine eventually looks simple: Jasmine has to be started with

`npx ts-node node_modules/jasmine/bin/jasmine.js ...`

The test data is stored in `./specs/data`.

### Coverage

The coverage is now computed with `c8` from https://github.com/bcoe/c8 


## API Definition

The API definition is tracked with https://api-extractor.com

After running `npm install`, the API documentation can be created with `npm run docs`.

Generating the documentation consists of two steps (which are subcommands of the `docs` command), namely
- extracting the API definitions from the build output
- generating the markdown from the API definitions.

The first step is performed by running `api-extractor`. The surface API information will be written into `./etc/3d-tiles-tools.md`. This file captures the public API, and changes in the public API will cause a warning to be printed

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


