import fs from "fs";
import path from "path";

import { BinaryBufferDataResolver } from "../../../src/base";
import { ResourceResolvers } from "../../../src/base";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

describe("BinaryBufferDataResolver", function () {
  it("resolves the data from the buffer structure of a glTF", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/Triangle/Triangle.gltf";
    const directory = path.dirname(p);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);

    const gltfBuffer = fs.readFileSync(p);
    const gltf = JSON.parse(gltfBuffer.toString());
    const binaryBufferData = await BinaryBufferDataResolver.resolve(
      gltf,
      undefined,
      resourceResolver
    );

    // The indices are unsigned short (16 bit) integer values
    const indicesBufferView = binaryBufferData.bufferViewsData[0];
    const indicesArray = new Uint16Array(
      indicesBufferView.buffer,
      indicesBufferView.byteOffset,
      indicesBufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT
    );
    const actualIndices = [...indicesArray];
    const expectedIndices = [0, 1, 2];

    // The positions are float values
    const positionsBufferView = binaryBufferData.bufferViewsData[1];
    const positionsArray = new Float32Array(
      positionsBufferView.buffer,
      positionsBufferView.byteOffset,
      positionsBufferView.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const actualPositions = [...positionsArray];
    // prettier-ignore
    const expectedPositions = [
      0.0, 0.0, 0.0, 
      1.0, 0.0, 0.0, 
      0.0, 1.0, 0.0
    ];

    expect(actualIndices).toEqual(expectedIndices);
    expect(actualPositions).toEqual(expectedPositions);
  });

  it("resolves the data from the buffer structure of a glTF with meshopt compression", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/Triangle/TriangleMeshopt.gltf";
    const directory = path.dirname(p);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);

    const gltfBuffer = fs.readFileSync(p);
    const gltf = JSON.parse(gltfBuffer.toString());
    const binaryBufferData = await BinaryBufferDataResolver.resolve(
      gltf,
      undefined,
      resourceResolver
    );

    // The indices are unsigned short (16 bit) integer values
    const indicesBufferView = binaryBufferData.bufferViewsData[0];
    const indicesArray = new Uint16Array(
      indicesBufferView.buffer,
      indicesBufferView.byteOffset,
      indicesBufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT
    );
    const actualIndices = [...indicesArray];
    const expectedIndices = [0, 1, 2];

    // The positions are ALSO unsigned 16-bit integer values (normalized)
    const positionsBufferView = binaryBufferData.bufferViewsData[1];
    const positionsArray = new Uint16Array(
      positionsBufferView.buffer,
      positionsBufferView.byteOffset,
      positionsBufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT
    );
    const actualPositions = [...positionsArray];
    // prettier-ignore
    const expectedPositions = [
      32769, 32769,     0,
          0, 32767, 32769,
          0,     0, 32769,
      32767,     0,     0
    ]

    expect(actualIndices).toEqual(expectedIndices);
    expect(actualPositions).toEqual(expectedPositions);
  });

  it("resolves the data from the buffer structure of a glTF without default byte offsets with meshopt compression", async function () {
    const p =
      SPECS_DATA_BASE_DIRECTORY + "/Triangle/TriangleMeshoptNoByteOffset.gltf";
    const directory = path.dirname(p);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);

    const gltfBuffer = fs.readFileSync(p);
    const gltf = JSON.parse(gltfBuffer.toString());
    const binaryBufferData = await BinaryBufferDataResolver.resolve(
      gltf,
      undefined,
      resourceResolver
    );

    // The indices are unsigned short (16 bit) integer values
    const indicesBufferView = binaryBufferData.bufferViewsData[0];
    const indicesArray = new Uint16Array(
      indicesBufferView.buffer,
      indicesBufferView.byteOffset,
      indicesBufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT
    );
    const actualIndices = [...indicesArray];
    const expectedIndices = [0, 1, 2];

    // The positions are ALSO unsigned 16-bit integer values (normalized)
    const positionsBufferView = binaryBufferData.bufferViewsData[1];
    const positionsArray = new Uint16Array(
      positionsBufferView.buffer,
      positionsBufferView.byteOffset,
      positionsBufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT
    );
    const actualPositions = [...positionsArray];
    // prettier-ignore
    const expectedPositions = [
      32769, 32769,     0,
          0, 32767, 32769,
          0,     0, 32769,
      32767,     0,     0
    ]

    expect(actualIndices).toEqual(expectedIndices);
    expect(actualPositions).toEqual(expectedPositions);
  });
});
