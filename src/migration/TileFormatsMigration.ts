import { Accessor, Document, Node } from "@gltf-transform/core";

import { BatchTable } from "../structure/TileFormats/BatchTable";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";
import { B3dmFeatureTable } from "../structure/TileFormats/B3dmFeatureTable";
import { I3dmFeatureTable } from "../structure/TileFormats/I3dmFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { GltfUtilities } from "../contentProcessing/GtlfUtilities";

import { PntsPointClouds } from "../contentProcessing/pointClouds/PntsPointClouds";
import { GltfTransformPointClouds } from "../contentProcessing/pointClouds/GltTransformPointClouds";
import { ReadablePointCloud } from "../contentProcessing/pointClouds/ReadablePointCloud";

import { TileTableData } from "./TileTableData";
import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";
import { TileTableDataToMeshFeatures } from "./TileTableDataToMeshFeatures";
import { BatchTables } from "./BatchTables";
import { Ids } from "./Ids";

import { MeshFeatures } from "../gltfMetadata/MeshFeatures";

import { PropertyModel } from "../metadata/PropertyModel";
import { DefaultPropertyModel } from "../metadata/DefaultPropertyModel";
import { TileFormatError } from "../tileFormats/TileFormatError";
import { EXTMeshGPUInstancing } from "@gltf-transform/extensions";
import { Iterables } from "../base/Iterables";
import { VecMath } from "./VecMath";
import { TileTableDataI3dm } from "./TileTableDataI3dm";
import { dedup, prune } from "@gltf-transform/functions";

/**
 * Methods for converting "legacy" tile formats into glTF assets
 * that use metadata extensions to represent the information from
 * the legacy formats.
 */
export class TileFormatsMigration {
  static readonly DEBUG_LOG = true;

  /**
   * Convert the given PNTS data into a glTF asset
   *
   * @param pntsBuffer - The PNTS buffer
   * @returns The GLB buffer
   */
  static async convertPntsToGlb(pntsBuffer: Buffer): Promise<Buffer> {
    const tileData = TileFormats.readTileData(pntsBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Batch table");
      console.log(JSON.stringify(batchTable, null, 2));

      console.log("Feature table");
      console.log(JSON.stringify(featureTable, null, 2));
    }
    //*/

    // Create a `ReadablePointCloud` that allows accessing
    // the PNTS data
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary,
      batchTable
    );

    // Check if the point cloud contains color information that may
    // require an alpha component (i.e. RGBA or CONSTANT_RGBA)
    const mayRequireAlpha = PntsPointClouds.mayRequireAlpha(featureTable);

    // Create a glTF-Transform document+primitive that represent
    // the point cloud
    const gltfTransformPointCloud = GltfTransformPointClouds.build(
      pntsPointCloud,
      mayRequireAlpha
    );
    const document = gltfTransformPointCloud.document;
    const primitive = gltfTransformPointCloud.primitive;

    // Apply quantization to the point cloud, if the input positions
    // had been quantized, or the normals had been oct-encoded
    const hasQuantizedPositions =
      PntsPointClouds.hasQuantizedPositions(featureTable);
    const hasOctEncodedNormals =
      PntsPointClouds.hasOctEncodedNormals(featureTable);
    await GltfTransformPointClouds.applyQuantization(
      document,
      hasQuantizedPositions,
      hasOctEncodedNormals
    );

    // If the point cloud is batched, then convert any batch table
    // information into a property table
    if (featureTable.BATCH_LENGTH) {
      const numRows = featureTable.BATCH_LENGTH;
      const propertyTable =
        TileTableDataToStructuralMetadata.convertBatchTableToPropertyTable(
          document,
          batchTable,
          batchTableBinary,
          numRows
        );
      if (propertyTable) {
        const meshFeatures =
          primitive.getExtension<MeshFeatures>("EXT_mesh_features");
        if (meshFeatures) {
          const featureIds = meshFeatures.listFeatureIds();
          for (const featureId of featureIds) {
            featureId.setPropertyTable(propertyTable);
          }
        }
      }
    } else {
      // The point cloud is not batched. Assign any batch table
      // information as per-point properties
      const externalProperties = TileFormatsMigration.computeExternalProperties(
        pntsPointCloud,
        batchTable
      );
      const numRows = featureTable.POINTS_LENGTH;
      TileTableDataToStructuralMetadata.assignPerPointProperties(
        document,
        primitive,
        batchTable,
        batchTableBinary,
        externalProperties,
        numRows
      );
    }

    // Create the GLB buffer
    const io = await GltfTransform.getIO();

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

  /**
   * Computes a mapping from property IDs to `PropertyModel` objects
   * for properties that are defined in the batch table, but not stored
   * in the batch table binary.
   *
   * Yeah, I'm looking at you, 3DTILES_draco_point_compression...
   *
   * The properties of the batch table that are draco-compressed
   * are actually read during the Draco decoding pass of the
   * feature table. The decoded values are stored as plain
   * attributes in the `ReadablePointCloud`. This method will
   * create `PropertyModel` objects for these attributes, so that
   * they can later be used for creating the accessors of the
   * attributes in the `EXT_structural_metadata` extension.
   *
   * @param pntsPointCloud - The point cloud that contains the PNTS data
   * @param batchTable The batch table
   * @returns The mapping
   */
  private static computeExternalProperties(
    pntsPointCloud: ReadablePointCloud,
    batchTable: BatchTable
  ): { [key: string]: PropertyModel } {
    const externalPropertiesById: { [key: string]: PropertyModel } = {};
    const dracoPropertyNames = BatchTables.obtainDracoPropertyNames(batchTable);
    for (const propertyName of dracoPropertyNames) {
      const propertyValue = batchTable[propertyName];
      if (propertyValue) {
        if (TileTableData.isBatchTableBinaryBodyReference(propertyValue)) {
          const propertyId = Ids.sanitize(propertyName);
          const attributeValues = pntsPointCloud.getAttributeValues(propertyId);
          if (attributeValues) {
            const propertyModel = new DefaultPropertyModel([
              ...attributeValues,
            ]);
            externalPropertiesById[propertyId] = propertyModel;
          }
        }
      }
    }
    return externalPropertiesById;
  }

  /**
   * Convert the given B3DM data into a glTF asset
   *
   * @param b3dmBuffer - The B3DM buffer
   * @returns The GLB buffer
   */
  static async convertB3dmToGlb(b3dmBuffer: Buffer): Promise<Buffer> {
    const tileData = TileFormats.readTileData(b3dmBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as B3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Batch table");
      console.log(JSON.stringify(batchTable, null, 2));

      console.log("Feature table");
      console.log(JSON.stringify(featureTable, null, 2));
    }
    //*/

    // If the B3DM contained glTF 1.0 data, try to upgrade it
    // with the gltf-pipeline first
    let glbBuffer = tileData.payload;
    const gltfVersion = GltfUtilities.getGltfVersion(glbBuffer);
    if (gltfVersion < 2.0) {
      console.log("Found glTF 1.0 - upgrading to glTF 2.0 with gltf-pipeline");
      glbBuffer = await GltfUtilities.upgradeGlb(glbBuffer, undefined);
      glbBuffer = await GltfUtilities.replaceCesiumRtcExtension(glbBuffer);
    }

    // Read the GLB data from the payload of the tile
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);
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

    // If there are batches, then convert the batch table into
    // an `EXT_structural_metadata` property table, and convert
    // the `_BATCHID` attributes of the primitives into
    // `_FEATURE_ID_0` attributes
    const numRows = featureTable.BATCH_LENGTH;
    if (numRows > 0) {
      const propertyTable =
        TileTableDataToStructuralMetadata.convertBatchTableToPropertyTable(
          document,
          batchTable,
          batchTableBinary,
          numRows
        );
      const meshes = root.listMeshes();
      for (const mesh of meshes) {
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
          // Convert the `_BATCHID` attribute into a `_FEATURE_ID_0`
          // attribute using the `EXT_mesh_features` extension
          const featureId =
            TileTableDataToMeshFeatures.convertBatchIdToMeshFeatures(
              document,
              primitive
            );
          if (propertyTable) {
            featureId.setPropertyTable(propertyTable);
          }
        }
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

  /**
   * Convert the given I3DM data into a glTF asset
   *
   * @param i3dmBuffer - The I3DM buffer
   * @returns The GLB buffer
   */
  static async convertI3dmToGlb(i3dmBuffer: Buffer): Promise<Buffer> {
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

    if (tileData.header.gltfFormat !== 1) {
      const gltfUri = tileData.payload;
      // TODO Resolve external GLB buffer
      throw new TileFormatError(
        "External references in I3DM are not yet supported"
      );
    }
    // If the I3DM contained glTF 1.0 data, try to upgrade it
    // with the gltf-pipeline first
    let glbBuffer = tileData.payload;
    const gltfVersion = GltfUtilities.getGltfVersion(glbBuffer);
    if (gltfVersion < 2.0) {
      console.log("Found glTF 1.0 - upgrading to glTF 2.0 with gltf-pipeline");
      glbBuffer = await GltfUtilities.upgradeGlb(glbBuffer, undefined);
      glbBuffer = await GltfUtilities.replaceCesiumRtcExtension(glbBuffer);
    }

    // Read the GLB data from the payload of the tile
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);
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

    for (const node of nodesWithMesh) {
      const accessors = TileFormatsMigration.createInstancingAccessors(
        document,
        featureTable,
        featureTableBinary,
        numInstances,
        node.getWorldMatrix()
      );

      console.log("Assigning extension to node");

      const meshGpuInstancing = extMeshGPUInstancing.createInstancedMesh();
      meshGpuInstancing.setAttribute(
        "TRANSLATION",
        accessors.positionsAccessor
      );
      if (accessors.rotationsAccessor) {
        meshGpuInstancing.setAttribute("ROTATION", accessors.rotationsAccessor);
      }
      if (accessors.scalesAccessor) {
        meshGpuInstancing.setAttribute("SCALE", accessors.scalesAccessor);
      }
      node.setExtension("EXT_mesh_gpu_instancing", meshGpuInstancing);
    }

    // TODO Remove these if possible
    await document.transform(dedup());
    await document.transform(prune());

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

  private static createInstancingAccessors(
    document: Document,
    featureTable: I3dmFeatureTable,
    featureTableBinary: Buffer,
    numInstances: number,
    matrix4: number[]
  ) {
    const root = document.getRoot();
    const buffer = root.listBuffers()[0];

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

    // TODO Analyze and verify these transforms more systematically!!!
    // For all current test cases, the transform from the glTF node
    // is a z-up-to-y-up transform, which is an involution (its own
    // inverse), meaning that SOME  of the following transforms almost
    // certainly are only correct for THIS particular case...
    const convertToGltf = (p: number[]): number[] => {
      let q = p;
      q = VecMath.convertYupToZup(q);
      return q;
    };
    const convertToGltfNode = (p: number[]): number[] => {
      let q = p;
      q = VecMath.convertYupToZup(q);
      q = VecMath.inverseTransform(matrix4, q);
      return q;
    };
    const convertRotationToGltf = (p: number[]): number[] => {
      let q = p;
      q = VecMath.convertZupToYup(q);
      q = VecMath.inverseTransform(matrix4, q);
      return q;
    };

    const positionsGltf = Iterables.map(positions, convertToGltf);
    const positionsGltfNode = Iterables.map(positions, convertToGltfNode);

    console.log("positionsLocal:");
    for (const p of positionsLocal) {
      console.log("  ", p);
    }
    console.log("positions:");
    for (const p of positions) {
      console.log("  ", p);
    }
    console.log("positionsGltf:");
    for (const p of positionsGltf) {
      console.log("  ", p);
    }
    console.log("positionsGltfNode:");
    for (const p of positionsGltfNode) {
      console.log("  ", p);
    }

    const positionsGltfNodeFlat = Iterables.flatten(positionsGltfNode);
    const positionsAccessor = document.createAccessor();
    positionsAccessor.setArray(new Float32Array(positionsGltfNodeFlat));
    positionsAccessor.setType(Accessor.Type.VEC3);
    positionsAccessor.setBuffer(buffer);

    let rotationsAccessor: Accessor | undefined = undefined;
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
      console.log("Create rotations from up and right");

      const normalsUpGltf = [...normalsUp].map(convertToGltf);
      const normalsRightGltf = [...normalsRight].map(convertToGltf);

      const rotationQuaternions =
        TileFormatsMigration.computeRotationQuaternions(
          normalsUpGltf,
          normalsRightGltf
        );

      console.log("rotationQuaternions");
      for (const p of rotationQuaternions) {
        console.log(p);
      }

      const rotationQuaternionsFlat = Iterables.flatten(rotationQuaternions);
      rotationsAccessor = document.createAccessor();
      rotationsAccessor.setArray(new Float32Array(rotationQuaternionsFlat));
      rotationsAccessor.setType(Accessor.Type.VEC4);
      rotationsAccessor.setBuffer(buffer);
    } else {
      if (featureTable.EAST_NORTH_UP === true) {
        console.log("Create rotations from eastNorthUp");
        let rotationQuaternions = Iterables.map(positionsGltf, (p: number[]) =>
          VecMath.computeEastNorthUpQuaternion(p)
        );

        rotationQuaternions = Iterables.map(
          rotationQuaternions,
          (q: number[]) => VecMath.transformAxis(q, convertRotationToGltf)
        );

        console.log("rotationQuaternions");
        for (const p of rotationQuaternions) {
          console.log(p);
        }

        const rotationQuaternionsFlat = Iterables.flatten(rotationQuaternions);
        rotationsAccessor = document.createAccessor();
        rotationsAccessor.setArray(new Float32Array(rotationQuaternionsFlat));
        rotationsAccessor.setType(Accessor.Type.VEC4);
        rotationsAccessor.setBuffer(buffer);
      }
    }

    let scalesAccessor: Accessor | undefined = undefined;
    const scales = TileTableDataI3dm.createScale(
      featureTable,
      featureTableBinary,
      numInstances
    );
    if (scales) {
      console.log("Create scales (uniform)");
      const scales3D = Iterables.map(scales, (s: number) => [s, s, s]);
      const scalesFlat = Iterables.flatten(scales3D);
      scalesAccessor = document.createAccessor();
      scalesAccessor.setArray(new Float32Array(scalesFlat));
      scalesAccessor.setType(Accessor.Type.VEC3);
      scalesAccessor.setBuffer(buffer);
    } else {
      const scalesNonUniform = TileTableDataI3dm.createNonUniformScale(
        featureTable,
        featureTableBinary,
        numInstances
      );
      if (scalesNonUniform) {
        console.log("Create scales (non-uniform)");
        const scalesFlat = Iterables.flatten(scalesNonUniform);
        scalesAccessor = document.createAccessor();
        scalesAccessor.setArray(new Float32Array(scalesFlat));
        scalesAccessor.setType(Accessor.Type.VEC3);
        scalesAccessor.setBuffer(buffer);
      }
    }

    return {
      positionsAccessor: positionsAccessor,
      rotationsAccessor: rotationsAccessor,
      scalesAccessor: scalesAccessor,
    };
  }

  private static computeRotationQuaternions(
    upVectors: number[][],
    rightVectors: number[][]
  ) {
    const n = upVectors.length;
    const quaternions: number[][] = [];
    for (let i = 0; i < n; i++) {
      const up = upVectors[i];
      const right = rightVectors[i];
      const quaternion = VecMath.computeQuaternion(up, right);
      quaternions.push(quaternion);
    }
    return quaternions;
  }

  /**
   * Apply the given RTC_CENTER to the given glTF-Transform document,
   * by inserting a new root node that carries the given RTC_CENTER
   * as its translation, taking into account the y-up-vs-z-up
   * transform.
   *
   * @param document - The glTF-Transform document
   * @param rtcCenter - The RTC_CENTER
   */
  private static applyRtcCenter(document: Document, rtcCenter: number[]) {
    const root = document.getRoot();
    const scenes = root.listScenes();
    for (const scene of scenes) {
      const oldChildren = scene.listChildren();
      for (const oldChild of oldChildren) {
        const rtcRoot = document.createNode();
        // Take the y-up-to-z-up transform into account
        const tx = rtcCenter[0];
        const ty = rtcCenter[2];
        const tz = -rtcCenter[1];
        rtcRoot.setTranslation([tx, ty, tz]);
        scene.removeChild(oldChild);
        rtcRoot.addChild(oldChild);
        scene.addChild(rtcRoot);
      }
    }
  }
}
