import fs from "fs";
import { TileFormats } from "../../src/tileFormats/TileFormats";

const compositePath = "./specs/data/composite.cmpt";
const compositeOfCompositePath = "./specs/data/compositeOfComposite.cmpt";

describe("extractCmpt", function () {
  let compositeBuffer: Buffer;
  let compositeOfCompositeBuffer: Buffer;

  beforeAll(async function () {
    compositeBuffer = fs.readFileSync(compositePath);
    compositeOfCompositeBuffer = fs.readFileSync(compositeOfCompositePath);
  });

  it("extracts a b3dm and i3dm from composite buffer", function () {
    const compositeTileData =
      TileFormats.readCompositeTileData(compositeBuffer);
    const innerTiles = compositeTileData.innerTileBuffers;
    const b3dmMagic = innerTiles[0].toString("utf8", 0, 4);
    const i3dmMagic = innerTiles[1].toString("utf8", 0, 4);

    expect(innerTiles.length).toBe(2);
    expect(b3dmMagic).toBe("b3dm");
    expect(i3dmMagic).toBe("i3dm");
  });

  it("extracts a b3dm and i3dm from composite-of-composite buffer", function () {
    const compositeOfCompositeTileData = TileFormats.readCompositeTileData(
      compositeOfCompositeBuffer
    );
    const innerCompositeBuffer =
      compositeOfCompositeTileData.innerTileBuffers[0];
    const compositeTileData =
      TileFormats.readCompositeTileData(innerCompositeBuffer);
    const innerTiles = compositeTileData.innerTileBuffers;
    const b3dmMagic = innerTiles[0].toString("utf8", 0, 4);
    const i3dmMagic = innerTiles[1].toString("utf8", 0, 4);
    expect(innerTiles.length).toBe(2);
    expect(b3dmMagic).toBe("b3dm");
    expect(i3dmMagic).toBe("i3dm");
  });
});
