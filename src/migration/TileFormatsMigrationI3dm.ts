import { Accessor, Document, Node } from "@gltf-transform/core";
import { EXTMeshGPUInstancing } from "@gltf-transform/extensions";

import { Iterables } from "../base/Iterables";

import { BatchTable } from "../structure/TileFormats/BatchTable";
import { I3dmFeatureTable } from "../structure/TileFormats/I3dmFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";
import { TileFormatError } from "../tileFormats/TileFormatError";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { GltfUtilities } from "../contentProcessing/GtlfUtilities";

import { TileTableData } from "./TileTableData";
import { VecMath } from "./VecMath";
import { TileTableDataI3dm } from "./TileTableDataI3dm";
import { TileFormatsMigration } from "./TileFormatsMigration";

/**
 * Methods for converting I3DM tile data into GLB
 */
export class TileFormatsMigrationI3dm {
  /**
   * Convert the given I3DM data into a glTF asset
   *
   * @param i3dmBuffer - The I3DM buffer
   * @param externalGlbResolver - A function that will be used to resolve
   * external GLB data if the I3DM uses `header.gltfFormat=0` (meaning
   * that the payload is not GLB data, but only a GLB URI).
   * @returns The GLB buffer
   * @throws TileFormatError If the I3DM contained an external GLB URI
   * that could not resolved by the given resolver
   */
  static async convertI3dmToGlb(
    i3dmBuffer: Buffer,
    externalGlbResolver: (uri: string) => Promise<Buffer | undefined>
  ): Promise<Buffer> {
    const tileData = TileFormats.readTileData(i3dmBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as I3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Batch table");
      console.log(JSON.stringify(batchTable, null, 2));

      console.log("Feature table");
      console.log(JSON.stringify(featureTable, null, 2));
    }
    //*/

    let glbBuffer = undefined;
    if (tileData.header.gltfFormat === 1) {
      glbBuffer = tileData.payload;
    } else {
      const glbUri = tileData.payload.toString().replace(/\0/g, "");
      glbBuffer = await externalGlbResolver(glbUri);
      if (!glbBuffer) {
        throw new TileFormatError(
          `Could not resolve external GLB from ${glbUri}`
        );
      }
    }
    // If the I3DM contained glTF 1.0 data, try to upgrade it
    // with the gltf-pipeline first
    const gltfVersion = GltfUtilities.getGltfVersion(glbBuffer);
    if (gltfVersion < 2.0) {
      console.log("Found glTF 1.0 - upgrading to glTF 2.0 with gltf-pipeline");
      glbBuffer = await GltfUtilities.upgradeGlb(glbBuffer, undefined);
      glbBuffer = await GltfUtilities.replaceCesiumRtcExtension(glbBuffer);
    }

    // Read the GLB data from the payload of the tile
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Input glTF JSON");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    const root = document.getRoot();
    root.getAsset().generator = "glTF-Transform";

    // If the feature table defines an `RTC_CENTER`, then insert
    // a new root node above each scene node, that carries the
    // RTC_CENTER as its translation
    if (featureTable.RTC_CENTER) {
      const rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      TileFormatsMigration.applyRtcCenter(document, rtcCenter);
    }

    const extMeshGPUInstancing = document.createExtension(EXTMeshGPUInstancing);
    extMeshGPUInstancing.setRequired(true);

    const numInstances = featureTable.INSTANCES_LENGTH;

    const nodes = root.listNodes();
    const nodesWithMesh = nodes.filter((n: Node) => n.getMesh() !== null);

    const groupedNodes =
      TileFormatsMigrationI3dm.groupNodesByTransform(nodesWithMesh);
    for (const group of groupedNodes) {
      const node0 = group[0];
      const nodeMatrix = node0.getWorldMatrix();

      console.log("Creating extension accessors for node matrix ", nodeMatrix);

      const positionsAccessor =
        TileFormatsMigrationI3dm.createPositionsInstancingAccessors(
          document,
          featureTable,
          featureTableBinary,
          numInstances,
          nodeMatrix
        );

      const rotationsAccessor =
        TileFormatsMigrationI3dm.createRotationsInstancingAccessors(
          document,
          featureTable,
          featureTableBinary,
          numInstances,
          nodeMatrix
        );

      const scalesAccessor =
        TileFormatsMigrationI3dm.createScalesInstancingAccessors(
          document,
          featureTable,
          featureTableBinary,
          numInstances
        );

      for (let i = 0; i < group.length; i++) {
        const node = group[i];

        console.log(
          "Assigning extension to node " + i + " of group with node matrix ",
          node.getWorldMatrix()
        );

        const meshGpuInstancing = extMeshGPUInstancing.createInstancedMesh();
        meshGpuInstancing.setAttribute("TRANSLATION", positionsAccessor);
        if (rotationsAccessor) {
          meshGpuInstancing.setAttribute("ROTATION", rotationsAccessor);
        }
        if (scalesAccessor) {
          meshGpuInstancing.setAttribute("SCALE", scalesAccessor);
        }
        node.setExtension("EXT_mesh_gpu_instancing", meshGpuInstancing);
      }
    }

    // Create the GLB buffer
    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("JSON document");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }

  private static groupNodesByTransform(nodes: Node[]): Node[][] {
    const keys: number[][] = [];
    const values: Node[][] = [];
    for (const node of nodes) {
      const nodeMatrix = node.getWorldMatrix();
      let index = -1;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (VecMath.equalsEpsilon(key, nodeMatrix)) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        values[index].push(node);
      } else {
        keys.push(nodeMatrix);
        const value = [node];
        values.push(value);
      }
    }
    return values;
  }

  /**
   * Create the world positions from the given feature table data.
   *
   * This will be the positions, as they are stored in the feature
   * table either as `POSITIONS` or `POSITIONS_QUANTIZED`, and
   * will include the RTC center (if it was defined by the
   * feature table).
   *
   * @param featureTable - The feature table
   * @param featureTableBinary The feature table binary
   * @param numInstances The number of instances
   * @returns The positions as an iterable over 3-element arrays
   */
  private static createWorldPositions(
    featureTable: I3dmFeatureTable,
    featureTableBinary: Buffer,
    numInstances: number
  ): Iterable<number[]> {
    const positionsLocal = TileTableData.createPositions(
      featureTable,
      featureTableBinary,
      numInstances
    );
    let positions = positionsLocal;
    const quantization = TileTableData.obtainQuantizationOffsetScale(
      featureTable,
      featureTableBinary
    );
    if (quantization) {
      positions = Iterables.map(positions, (p: number[]) => {
        const px = p[0] + quantization.offset[0];
        const py = p[1] + quantization.offset[1];
        const pz = p[2] + quantization.offset[2];
        return [px, py, pz];
      });
    }
    if (featureTable.RTC_CENTER) {
      const rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      positions = Iterables.map(positions, (p: number[]) => {
        const px = p[0] + rtcCenter[0];
        const py = p[1] + rtcCenter[1];
        const pz = p[2] + rtcCenter[2];
        return [px, py, pz];
      });
    }
    return positions;
  }

  /**
   * Creates a glTF-Transform accessor for the positions (translation)
   * to be put into the `EXT_gpu_mesh_instancing` extension, based on
   * the positions that are read from the given I3DM data.
   *
   * @param document - The glTF-Transform document
   * @param featureTable - The feature table
   * @param featureTableBinary - The feature table binary
   * @param numInstances - The number of instances
   * @param nodeMatrix The global transform matrix of the node that
   * the instancing extension will be attached to
   * @returns The glTF-Transform accessor
   */
  private static createPositionsInstancingAccessors(
    document: Document,
    featureTable: I3dmFeatureTable,
    featureTableBinary: Buffer,
    numInstances: number,
    nodeMatrix: number[]
  ): Accessor {
    const positions = TileFormatsMigrationI3dm.createWorldPositions(
      featureTable,
      featureTableBinary,
      numInstances
    );
    const zupToYup = VecMath.createZupToYupPacked4();
    const inverseNodeMatrix = VecMath.invert4(nodeMatrix);
    const positionsGltfNode = Iterables.map(positions, (p: number[]) => {
      // To obtain the position that has to be put into the
      // instancing extension:
      // - transform the origin with the node transform
      // - add the I3DM position (taking z-up-to-y-up into account)
      // - transform the result back with the inverse node transform
      let result = [0, 0, 0];
      result = VecMath.transform(nodeMatrix, result);
      const q = VecMath.transform(zupToYup, p);
      result = VecMath.add(result, q);
      result = VecMath.transform(inverseNodeMatrix, result);
      return result;
    });

    const positionsGltfNodeFlat = Iterables.flatten(positionsGltfNode);

    // Create the glTF-Transform accessor containing the resulting data
    const root = document.getRoot();
    const buffer = root.listBuffers()[0];
    const positionsAccessor = document.createAccessor();
    positionsAccessor.setArray(new Float32Array(positionsGltfNodeFlat));
    positionsAccessor.setType(Accessor.Type.VEC3);
    positionsAccessor.setBuffer(buffer);
    return positionsAccessor;
  }

  /**
   * Creates a glTF-Transform accessor for the rotations to be put
   * into the `EXT_gpu_mesh_instancing` extension, based on
   * the rotations that are read from the given I3DM data.
   *
   * @param document - The glTF-Transform document
   * @param featureTable - The feature table
   * @param featureTableBinary - The feature table binary
   * @param numInstances - The number of instances
   * @param nodeMatrix The global transform matrix of the node that
   * the instancing extension will be attached to
   * @returns The glTF-Transform accessor, or undefined if the
   * I3DM did not define rotations
   */
  private static createRotationsInstancingAccessors(
    document: Document,
    featureTable: I3dmFeatureTable,
    featureTableBinary: Buffer,
    numInstances: number,
    nodeMatrix: number[]
  ): Accessor | undefined {
    const positions = TileFormatsMigrationI3dm.createWorldPositions(
      featureTable,
      featureTableBinary,
      numInstances
    );

    // Create a function that receives a 4x4 matrix that was obtained
    // as a "EAST_NORTH_UP" matrix, and converts this matrix into
    // a matrix that describes the rotation that has to be assigned
    // to the instances in the glTF extension.
    const matrixZupToYup = VecMath.createZupToYupPacked4();
    const matrixYupToZup = VecMath.createYupToZupPacked4();
    const inverseNodeRotation = VecMath.inverseRotation4(nodeMatrix);
    function convertRotationMatrixToGltf(rotationMatrix4: number[]) {
      const resultMatrix = VecMath.multiplyAll4([
        matrixZupToYup,
        inverseNodeRotation,
        rotationMatrix4,
        matrixYupToZup,
      ]);
      return resultMatrix;
    }

    const normalsUp = TileTableDataI3dm.createNormalsUp(
      featureTable,
      featureTableBinary,
      numInstances
    );
    const normalsRight = TileTableDataI3dm.createNormalsRight(
      featureTable,
      featureTableBinary,
      numInstances
    );
    if (normalsUp && normalsRight) {
      // Convert the up- and right normals that are given in the
      // I3DM to the glTF coordinate system, by transforming them
      // with the Z-up-to-Y-up transform
      const convertNormalToGltf = (p: number[]): number[] => {
        return VecMath.transform(matrixZupToYup, p);
      };
      const normalsUpGltf = [...normalsUp].map(convertNormalToGltf);
      const normalsRightGltf = [...normalsRight].map(convertNormalToGltf);

      const rotationQuaternions = VecMath.computeRotationQuaternions(
        normalsUpGltf,
        normalsRightGltf
      );

      //*/
      if (TileFormatsMigration.DEBUG_LOG) {
        console.log("Create rotations from up and right");
        console.log("rotationQuaternions");
        for (const p of rotationQuaternions) {
          console.log(p);
        }
      }
      //*/

      const rotationQuaternionsFlat = Iterables.flatten(rotationQuaternions);

      // Create the glTF-Transform accessor containing the resulting data
      const root = document.getRoot();
      const buffer = root.listBuffers()[0];
      const rotationsAccessor = document.createAccessor();
      rotationsAccessor.setArray(new Float32Array(rotationQuaternionsFlat));
      rotationsAccessor.setType(Accessor.Type.VEC4);
      rotationsAccessor.setBuffer(buffer);
      return rotationsAccessor;
    }

    if (featureTable.EAST_NORTH_UP === true) {
      // Obtain the rotation matrices from the world positions
      const rotationMatrices = Iterables.map(positions, (p: number[]) => {
        return VecMath.computeEastNorthUpMatrix4(p);
      });

      // Convert the rotation matrices to the glTF coorinate
      // space of the node that the instancing extension will
      // be attached to
      const rotationMatricesForGltf = Iterables.map(
        rotationMatrices,
        convertRotationMatrixToGltf
      );

      // Create the quaternions for the instancing extension
      // from the resulting rotation matrices
      const rotationQuaternions = Iterables.map(
        rotationMatricesForGltf,
        VecMath.matrix4ToQuaternion
      );

      //*/
      if (TileFormatsMigration.DEBUG_LOG) {
        console.log("Create rotations from eastNorthUp");
        console.log("rotationQuaternions");
        for (const p of rotationQuaternions) {
          console.log(p);
        }
      }
      //*/

      const rotationQuaternionsFlat = Iterables.flatten(rotationQuaternions);

      // Create the glTF-Transform accessor containing the resulting data
      const root = document.getRoot();
      const buffer = root.listBuffers()[0];
      const rotationsAccessor = document.createAccessor();
      rotationsAccessor.setArray(new Float32Array(rotationQuaternionsFlat));
      rotationsAccessor.setType(Accessor.Type.VEC4);
      rotationsAccessor.setBuffer(buffer);
      return rotationsAccessor;
    }

    return undefined;
  }

  /**
   * Creates a glTF-Transform accessor for the scalings to be put
   * into the `EXT_gpu_mesh_instancing` extension, based on
   * the scaling information from the given I3DM data.
   *
   * @param document - The glTF-Transform document
   * @param featureTable - The feature table
   * @param featureTableBinary - The feature table binary
   * @param numInstances - The number of instances
   * @returns The glTF-Transform accessor, or undefined
   * if the I3DM did not contain scaling information
   */
  private static createScalesInstancingAccessors(
    document: Document,
    featureTable: I3dmFeatureTable,
    featureTableBinary: Buffer,
    numInstances: number
  ): Accessor | undefined {
    const scales = TileTableDataI3dm.createScale(
      featureTable,
      featureTableBinary,
      numInstances
    );
    if (scales) {
      //*/
      if (TileFormatsMigration.DEBUG_LOG) {
        console.log("Create scales (uniform)");
      }
      //*/
      const scales3D = Iterables.map(scales, (s: number) => [s, s, s]);
      const scalesFlat = Iterables.flatten(scales3D);

      // Create the glTF-Transform accessor containing the resulting data
      const root = document.getRoot();
      const buffer = root.listBuffers()[0];
      const scalesAccessor = document.createAccessor();
      scalesAccessor.setArray(new Float32Array(scalesFlat));
      scalesAccessor.setType(Accessor.Type.VEC3);
      scalesAccessor.setBuffer(buffer);
      return scalesAccessor;
    }

    const scalesNonUniform = TileTableDataI3dm.createNonUniformScale(
      featureTable,
      featureTableBinary,
      numInstances
    );
    if (scalesNonUniform) {
      //*/
      if (TileFormatsMigration.DEBUG_LOG) {
        console.log("Create scales (non-uniform)");
      }
      //*/

      // Convert from z-up to y-up (but not with a rotation, because
      // that would change the sign of the scaling factors)
      const scalesGltf = Iterables.map(scalesNonUniform, (s: number[]) => {
        return [s[0], s[2], s[1]];
      });
      const scalesFlat = Iterables.flatten(scalesGltf);

      // Create the glTF-Transform accessor containing the resulting data
      const root = document.getRoot();
      const buffer = root.listBuffers()[0];
      const scalesAccessor = document.createAccessor();
      scalesAccessor.setArray(new Float32Array(scalesFlat));
      scalesAccessor.setType(Accessor.Type.VEC3);
      scalesAccessor.setBuffer(buffer);
      return scalesAccessor;
    }

    return undefined;
  }
}
