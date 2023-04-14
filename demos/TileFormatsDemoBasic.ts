import fs from "fs";

import { TileFormats } from "../src/tileFormats/TileFormats";

// Read the data from the specified file into a buffer,
// nad pass this buffer to readTileDataBuffer
function readTileData(fileName: string) {
  console.log("Reading " + fileName);
  const tileDataBuffer = fs.readFileSync(fileName);
  readTileDataBuffer(tileDataBuffer);
}

// Reads the tile data from the given buffer, and prints it
function readTileDataBuffer(tileDataBuffer: Buffer) {
  const isComposite = TileFormats.isComposite(tileDataBuffer);
  if (isComposite) {
    console.log("Found composite data");
    const compositeTileData = TileFormats.readCompositeTileData(tileDataBuffer);
    for (const innerTileDataBuffer of compositeTileData.innerTileBuffers) {
      readTileDataBuffer(innerTileDataBuffer);
    }
  } else {
    console.log("Found non-composite data");
    const tileData = TileFormats.readTileData(tileDataBuffer);
    console.log(tileData);
  }
}

function testTileFormatsBasic() {
  readTileData("./specs/data/BatchedDeprecated1/batchedDeprecated1.b3dm");
  readTileData("./specs/data/BatchedDeprecated2/batchedDeprecated2.b3dm");
  readTileData("./specs/data/Textured/batchedTextured.b3dm");
  readTileData("./specs/data/Textured/instancedTextured.i3dm");
  readTileData("./specs/data/compositeOfComposite.cmpt");
}

testTileFormatsBasic();
