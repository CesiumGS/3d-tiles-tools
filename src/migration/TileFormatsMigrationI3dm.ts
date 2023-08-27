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
import { GltfUtilities } from "../contentProcessing/GltfUtilities";

import { VecMath } from "../tileTableData/VecMath";
import { TileFormatsMigration } from "./TileFormatsMigration";
import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";

import { TileTableDataI3dm } from "../tileTableData/TileTableDataI3dm";
import { TileTableData } from "../tileTableData/TileTableData";

import { EXTInstanceFeatures } from "../gltfExtensions/EXTInstanceFeatures";
import { InstanceFeaturesUtils } from "../gltfExtensions/InstanceFeaturesUtils";
import { StructuralMetadataUtils } from "../gltfExtensions/StructuralMetadataUtils";

/**
 * Methods for converting I3DM tile data into GLB
 *
 * @internal
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

    // Create the glTF-Transform accessors containing the data
    // for the EXT_mesh_gpu_instancing extension
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

    // If there is a batch table, convert it into a property table
    // using the EXT_structural_metadata extension. This method
    // will convert the batch table into a metadata schema and
    // assign it to the document. It will return `undefined´ if
    // there is no batch table (or when no metadata schema can
    // be created from the batch table)
    const propertyTable =
      TileTableDataToStructuralMetadata.convertBatchTableToPropertyTable(
        document,
        batchTable,
        batchTableBinary,
        numInstances
      );

    // If the input data defines a BATCH_ID, then convert this into
    // the EXT_instance_features extension. If the input does
    // NOT define a BATCH_ID, but has a batch table (as indicated
    // by the propertyTable being defined), then create artificial
    // batch IDs, consisting of consecutive numbers.
    let featureIdComponentType = "UINT16";
    let batchIds = undefined;
    const batchId = featureTable.BATCH_ID;
    if (batchId) {
      batchIds = TileTableDataI3dm.createBatchIds(
        featureTable,
        featureTableBinary
      );
      const componentType =
        TileTableData.obtainBatchIdComponentType(featureTable);
      if (componentType !== undefined) {
        featureIdComponentType = componentType;
      }
    } else if (propertyTable) {
      batchIds = [];
      for (let i = 0; i < numInstances; i++) {
        batchIds.push(i);
      }
    }

    // If there are batch IDs (either from the BATCH_ID, or created
    // as consecutive numbers for accessing the property table), then
    // use them to create a feature ID accessor that will be used
    // in the EXT_instance_features extension
    let extInstanceFeatures = undefined;
    let instanceFeaturesAccessor = undefined;
    let featureCount = 0;
    const featureIdAttributeNumber = 0;
    const featureIdAttributeName = `_FEATURE_ID_${featureIdAttributeNumber}`;
    if (batchIds) {
      extInstanceFeatures = document.createExtension(EXTInstanceFeatures);

      instanceFeaturesAccessor = document.createAccessor();
      instanceFeaturesAccessor.setBuffer(buffer);
      instanceFeaturesAccessor.setType(Accessor.Type.SCALAR);

      const batchIdsArray = [...batchIds];
      featureCount = new Set(batchIdsArray).size;

      if (featureIdComponentType === "UINT8") {
        instanceFeaturesAccessor.setArray(new Uint8Array(batchIdsArray));
      } else if (featureIdComponentType === "UINT16") {
        instanceFeaturesAccessor.setArray(new Uint16Array(batchIdsArray));
      } else if (featureIdComponentType === "UINT32") {
        instanceFeaturesAccessor.setArray(new Uint8Array(batchIdsArray));
      } else {
        throw new TileFormatError(
          `Expected UINT8, UINT16 or UINT32 as the ` +
            `BATCH_ID component type, but found ${featureIdComponentType}`
        );
      }
    }

    // Create the EXT_mesh_gpu_instancing extension in the document
    const extMeshGPUInstancing = document.createExtension(EXTMeshGPUInstancing);
    extMeshGPUInstancing.setRequired(true);

    // Assign the extension objects to each node that has a mesh
    // (always using the same accessors)
    const nodesWithMesh = root
      .listNodes()
      .filter((n: Node) => n.getMesh() !== null);
    for (const node of nodesWithMesh) {
      // Assign the EXT_mesh_gpu_instancing extension object
      const meshGpuInstancing = extMeshGPUInstancing.createInstancedMesh();
      meshGpuInstancing.setAttribute("TRANSLATION", translationsAccessor);
      if (rotationsAccessor) {
        meshGpuInstancing.setAttribute("ROTATION", rotationsAccessor);
      }
      if (scalesAccessor) {
        meshGpuInstancing.setAttribute("SCALE", scalesAccessor);
      }
      if (instanceFeaturesAccessor) {
        meshGpuInstancing.setAttribute(
          featureIdAttributeName,
          instanceFeaturesAccessor
        );
      }
      node.setExtension("EXT_mesh_gpu_instancing", meshGpuInstancing);

      // If the input defined batch ID, then assign them using the
      // EXT_instance_features extension.
      if (instanceFeaturesAccessor && extInstanceFeatures) {
        // Create a `FeatureId` object. This object indicates that the IDs
        // are stored in the attribute `_FEATURE_ID_${attributeNumber}`
        const featureIdFromAttribute = extInstanceFeatures.createFeatureId();
        featureIdFromAttribute.setFeatureCount(featureCount);
        featureIdFromAttribute.setAttribute(featureIdAttributeNumber);

        if (propertyTable) {
          featureIdFromAttribute.setPropertyTable(propertyTable);
        }

        // Create a `InstanceFeatures` object that contains the
        // created `FeatureID` objects, and store it as an
        // extension object in the `Node`
        const instanceFeatures = extInstanceFeatures.createInstanceFeatures();
        instanceFeatures.addFeatureId(featureIdFromAttribute);
        node.setExtension("EXT_instance_features", instanceFeatures);
      }
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

      console.log("Metadata information:");
      console.log(
        InstanceFeaturesUtils.createInstanceFeaturesInfoString(document)
      );
      console.log(
        StructuralMetadataUtils.createStructuralMetadataInfoString(document)
      );
    }
    //*/

    // Create the GLB buffer
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }
}
