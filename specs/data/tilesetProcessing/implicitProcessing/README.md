
An example tileset for basic tests of the processing functionality 
for implicit tilesets.

It is an implicit quadttree tileset with 4 levels (2 subtree levels),
with content being available at `level, x, y`:

- 3, 3, 2
- 3, 4, 2
- 3, 2, 3
- 3, 3, 3
- 3, 4, 3
- 3, 5, 3
- 3, 2, 4
- 3, 3, 4
- 3, 4, 4
- 3, 5, 4
- 3, 3, 5
- 3, 4, 5

forming a small (low-resolution) "circle" in the center, and
content being available for all ancestor tiles of these
coordinates.

