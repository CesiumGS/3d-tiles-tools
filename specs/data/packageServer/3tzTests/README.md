# Test data for 3TZ handling in the package server

- `3tz_basic`: A basic tileset JSON file that refers to 3TZ files as external tilesets
- `3tz_direct`: A tileset JSON file that refers to GLB files that are contained in 3TZ files
- `3tz_chained`: A tileset JSON that refers to two 3TZ files as external tilesets, which each refer to two other 3TZ files as external tilesets
- `3tz_chained_uppercase`: The same as `3tz_chained`, but with uppercase `.3TZ` file extensions
- `3tz_chained_subdirs`: A tileset JSON that refers to two 3TZ files in subdirectories as external tilesets, which each refer to two 3TZ files from the root directory as external tilesets
- `3tz_chained_subdirs_direct`: A tileset JSON that refers to two 3TZ files in subdirectories as external tilesets, which refer to GLB files that are contained in 3TZ files in the root directory
- `3tz_chained_deep`: A tileset that tests cross-referencing (details below)
- `3tz_flat`: A tileset that is directly and completely stored in a 3TZ file
- `3tz_inner_subdirs`: A tileset that refers to 3TZ files that are stored in subdirectories, and GLB files that are stored in subdirectories in 3TZ files that are stored in subdirectories


About `3tz_chained_deep`:

The root directory has subdirectories `/subdir1/subdir2/subdir3`.

The main tileset JSON refers to the 3TZ files in the root directory.

- `tileset0to1_A.3tz` refers to `subdir1/tilesetA.3tz`
- `tileset0to1_B.3tz` refers to `subdir1/tileset1to2_B.3tz`
  - This refers to `subdir2/tilesetB.3tz`
- `tileset0to3_C.3tz` refers to `/subdir1/subdir2/subdir3/tileset3to2_C.3tz`
  - This refers to `../tilesetC.3tz` (ending up at `subdir1/subdir2/tilesetC.3tz`)
- `tileset0to3_D.3tz` refers to `/subdir1/subdir2/subdir3/tileset3to1_D.3tz`
  - This refers to `../../tilesetD.3tz` (ending up at `subdir1/tilesetD.3tz`

The goal of this is to test up- and downward references of 1 or 2 steps.
