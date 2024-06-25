A regression test for https://github.com/CesiumGS/3d-tiles-tools/issues/138 

```
tileset.json refers to
  sub0/externalA.json
  
sub0/externalA.json refers to
  tileA.b3dm
  externalB.json
  
sub0/externalB.json refers to
  tileB.b3dm
```  

The content URI for `tileB.b3dm` of the combined result should be `sub0/tileB.b3dm`

  
  