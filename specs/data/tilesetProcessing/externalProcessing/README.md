
A basic tileset to test whether the tileset processing operations (like 
converting B3DM to GLB) are correctly applied to external tilesets.

`tileset.json` refers to `tile.b3dm` and `externalA.json`.
The content and external tileset are in the same directory.

`externalA.json` refers to `tileA.b3dm` and `ExternalB/externalB.json`.
The content is in the same directory. 
The external tileset is in a subdirectory.

`externalB.json` refers to `tileB.b3dm`, `../tileX.b3dm`, and `../ExternalC/externalC.json`.
One content is in the same directory. 
The other one is in the parent directory, accessed with `..`.
The external tileset is in a sibling directory, accessed with `..`.

`externalC.json` refers to `tileC0.b3dm` and `..tileC1.b3dm`.
One content is in the same directory. 
The other one is in the parent directory, accessed with `..`.

The `tileX.b3dm` is referred to by TWO tilesets (but should
be processed only once)








