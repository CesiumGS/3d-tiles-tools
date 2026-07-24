import { SpecHelpers } from "../../SpecHelpers";
import { GltfTransform } from "../../../src/tools/";
import { PrimitiveOutline } from "../../../src/gltf-extensions";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();
const sourceDir =
  SPECS_DATA_BASE_DIRECTORY + "/gltf-extensions/BoxPrimitiveOutline/";

describe("CESIUMPrimitiveOutline", function () {
  it("reads the CESIUM_primitive_outline and its indices", async function () {
    const sourceFileName = sourceDir + "BoxPrimitiveOutline.glb";
    const io = await GltfTransform.getIO();
    const document = await io.read(sourceFileName);
    const root = document.getRoot();
    const meshes = root.listMeshes();
    const mesh = meshes[0];
    const primitives = mesh.listPrimitives();
    const primitive = primitives[0];
    const extension = primitive.getExtension<PrimitiveOutline>(
      "CESIUM_primitive_outline"
    );
    const indices = extension?.getIndices();
    const actual = [...indices?.getArray()];

    // See the README of the 'BoxPrimitiveOutline' test data
    // for a description of the outline indices
    const expected = [
      0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 12, 13, 8, 9, 11, 10, 14,
      15,
    ];
    expect(actual).toEqual(expected);
  });
});
