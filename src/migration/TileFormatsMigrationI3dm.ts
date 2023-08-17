import { Accessor } from "@gltf-transform/core";
import { Logger } from "@gltf-transform/core";
import { Node } from "@gltf-transform/core";
import { clearNodeTransform } from "@gltf-transform/functions";
import { clearNodeParent } from "@gltf-transform/functions";
import { prune } from "@gltf-transform/functions";

import { EXTMeshGPUInstancing } from "@gltf-transform/extensions";

import { Iterables } from "../base/Iterables";

import { BatchTable } from "../structure/TileFormats/BatchTable";
import { I3dmFeatureTable } from "../structure/TileFormats/I3dmFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";
import { TileFormatError } from "../tileFormats/TileFormatError";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { GltfUtilities } from "../contentProcessing/GtlfUtilities";

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

    const numInstances = featureTable.INSTANCES_LENGTH;

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Batch table");
      console.log(JSON.stringify(batchTable, null, 2));

      console.log("Feature table");
      console.log(JSON.stringify(featureTable, null, 2));
    }
    //*/

    // Obtain the GLB buffer for the tile data. With `gltfFormat===1`, it
    // is stored directly as the payload. Otherwise (with `gltfFormat===0`)
    // the payload is a URI that has to be resolved.
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

    // Create a glTF-Transform document from the GLB buffer
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);
    const root = document.getRoot();
    root.getAsset().generator = "glTF-Transform";

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Input glTF JSON");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    // Flatten all nodes in the glTF asset. This will collapse
    // all nodes to essentially be "root nodes" in the scene.
    // The transforms of these nodes will be the identity matrix,
    // and their previous transforms will be baked into the meshes.
    const nodes = root.listNodes();
    for (const node of nodes) {
      clearNodeParent(node);
      clearNodeTransform(node);
    }
    document.setLogger(new Logger(Logger.Verbosity.SILENT));
    document.transform(prune());

    // Insert a single root node above the "flatteded" nodes
    TileFormatsMigration.makeSingleRoot(document);

    // Compute the positions in world space (taking the RTC_CENTER
    // into account if it was present)
    const worldPositions = TileTableDataI3dm.createWorldPositions(
      featureTable,
      featureTableBinary,
      numInstances
    );

    // Compute the center of all positions. This will later be
    // inserted as a translation of the root node, similar to
    // the RTC_CENTER, even if no RTC_CENTER was given explicitly
    const positionsCenter = VecMath.computeMean3D(worldPositions);

    // Compute the translations, relative to the center,
    const translations = Iterables.map(worldPositions, (p: number[]) => {
      return VecMath.subtract(p, positionsCenter);
    });

    // Compute the 4x4 rotation quaternions and scaling factors from
    // the I3DM data, and use this to compute the whole
    // instancing transforms as 4x4 matrices.
    const rotationQuaternions = TileTableDataI3dm.createRotationQuaternions(
      featureTable,
      featureTableBinary,
      numInstances
    );
    const scales3D = TileTableDataI3dm.createScales3D(
      featureTable,
      featureTableBinary,
      numInstances
    );
    const i3dmMatrices = TileTableDataI3dm.createMatrices(
      translations,
      rotationQuaternions,
      scales3D,
      numInstances
    );

    const matrixZupToYup = VecMath.createZupToYupPacked4();
    const matrixYupToZup = VecMath.createYupToZupPacked4();

    // Compute the data for the instancing extension accessors
    // from the I3DM matrices, by decomposing them into their
    // TRS (translation, rotation, scale) components and putting
    // these into flat arrays.
    const translationsForAccessor = [];
    const rotationsForAccessor = [];
    const scalesForAccessor = [];
    for (const i3dmMatrix of i3dmMatrices) {
      // Convert the matrix into the right coordinate system
      const gltfMatrix = VecMath.multiplyAll4([
        matrixZupToYup,
        i3dmMatrix,
        matrixYupToZup,
      ]);

      const trs = VecMath.decomposeMatrixTRS(gltfMatrix);
      translationsForAccessor.push(...trs.t);
      rotationsForAccessor.push(...trs.r);
      scalesForAccessor.push(...trs.s);
    }

    // Create the glTF-Transform accessors containing the resulting data
    const buffer = root.listBuffers()[0];

    const translationsAccessor = document.createAccessor();
    translationsAccessor.setArray(new Float32Array(translationsForAccessor));
    translationsAccessor.setType(Accessor.Type.VEC3);
    translationsAccessor.setBuffer(buffer);

    const rotationsAccessor = document.createAccessor();
    rotationsAccessor.setArray(new Float32Array(rotationsForAccessor));
    rotationsAccessor.setType(Accessor.Type.VEC4);
    rotationsAccessor.setBuffer(buffer);

    const scalesAccessor = document.createAccessor();
    scalesAccessor.setArray(new Float32Array(scalesForAccessor));
    scalesAccessor.setType(Accessor.Type.VEC3);
    scalesAccessor.setBuffer(buffer);

    // Create the extension in the document
    const extMeshGPUInstancing = document.createExtension(EXTMeshGPUInstancing);
    extMeshGPUInstancing.setRequired(true);

    // Assign the extension object to each node that has a mesh
    // (always using the same accessors)
    const nodesWithMesh = root
      .listNodes()
      .filter((n: Node) => n.getMesh() !== null);
    for (const node of nodesWithMesh) {
      const meshGpuInstancing = extMeshGPUInstancing.createInstancedMesh();
      meshGpuInstancing.setAttribute("TRANSLATION", translationsAccessor);
      if (rotationsAccessor) {
        meshGpuInstancing.setAttribute("ROTATION", rotationsAccessor);
      }
      if (scalesAccessor) {
        meshGpuInstancing.setAttribute("SCALE", scalesAccessor);
      }
      node.setExtension("EXT_mesh_gpu_instancing", meshGpuInstancing);
    }

    // Add the "positions center" that was previously subtracted
    // from the positions, as a translation of the root node of
    // the glTF.
    TileFormatsMigration.applyRtcCenter(document, positionsCenter);

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("JSON document");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    // Create the GLB buffer
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }
}
