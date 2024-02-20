import fs from "fs";

import { TileFormats } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

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
  readTileData(
    SPECS_DATA_BASE_DIRECTORY + "/BatchedDeprecated1/batchedDeprecated1.b3dm"
  );
  readTileData(
    SPECS_DATA_BASE_DIRECTORY + "/BatchedDeprecated2/batchedDeprecated2.b3dm"
  );
  readTileData(SPECS_DATA_BASE_DIRECTORY + "/Textured/batchedTextured.b3dm");
  readTileData(SPECS_DATA_BASE_DIRECTORY + "/Textured/instancedTextured.i3dm");
  readTileData(SPECS_DATA_BASE_DIRECTORY + "/compositeOfComposite.cmpt");
}

testTileFormatsBasic();
