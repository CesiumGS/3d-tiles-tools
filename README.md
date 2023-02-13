# 3D Tiles Tools

**Draft** demos:

Basic functions for reading tile data:
```
npx ts-node ./demos/TileFormatsDemoBasic.ts
```

Basic functions for converting tile data:
```
npx ts-node ./demos/TileFormatsDemoConversions.ts
```

Demos for content data type detection (extracted from validator):
```
npx ts-node ./demos/ContentDataTypeRegistryDemo.ts
```

Demos for tileset processing (merge, combine, upgrade - preliminarily revived state from the current 3d-tiles-tools)
```
npx ts-node ./demos/TilesetProcessingDemos.ts
```

### Archive/Package functions 

These are from the internal packages project, that was partially copied to the validator as well

Basic examples of creating and reading packages:
```
npx ts-node ./demos/3d-tiles-packages-examples.ts
```

Basic benchmark for creating 3DTILES/3TZ packages with artifical data:
```
npx ts-node ./demos/3d-tiles-packages-creation-benchmark.ts
```

Basic benchmark for reading the 3DTILES/3TZ that have been created with the previous benchmark:
```
npx ts-node ./demos/3d-tiles-packages-reading-benchmark.ts
```

Package conversion:
```
npx ts-node ./demos/tileset-package-conversion.ts -i ./specs/data/Tileset -o ./output/example.3tz
```
(Input may be 3TZ, 3DTILES, ZIP, or directory. Output may be 3TZ, 3DTILES, or directory)

**Very** simple draft of a package server:
```
npx ts-node ./demos/tileset-source-server.ts -s ./specs/data/Tileset
```
to be opened with the `TilesetSourceSandcastle.js`.



