The `.3dtiles` files are used for the `TilesetSource3dtilesSpec`:

The `TilesetSource3dtiles` is supposed to check the basic structure 
of the 3DTILES files for validity in terms of the table- and column
names and types.


The `.3tz` files are used for the `TilesetSource3tzSpec`:

The `TilesetSource3tz` should be able to read various 3TZ files:

- `valid.3tz` is a valid 3TZ. Hence the name.
- `validSmall.3tz` is a regression test: It is a 3TZ that is smaller 
  than 320 bytes, which previusly caused the archive functions to
  crash (See https://github.com/CesiumGS/3d-tiles-tools/pull/173)
- `validWith64byteExtrasInZipFileHeader.3tz` is another regression test: 
  It is 3TZ where the ZIP file headers contain 64 bytes in their `extras`
  field. (This file has been manually crafted and the 64 bytes are just
  dummy data - this may cause glitches in other ZIP tools, but should be 
  a valid ZIP file in general). Such an `extras` field - even a "valid" 
  one that was inserted by another ZIP tool - previously also caused 
  errors in the archive functions. 
  (See https://github.com/CesiumGS/3d-tiles-tools/pull/173)
