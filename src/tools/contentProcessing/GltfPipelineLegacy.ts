import { Cartesian3 } from "cesium";
import { Ellipsoid } from "cesium";

import { defined } from "../../base";
import { defaultValue } from "../../base";
import { DeveloperError } from "../../base";

import { Extensions } from "../../tilesets";

/**
 * Methods and fragments ported from a legacy version of gltf-pipeline.
 * (Sorry, no more specific details here...)
 *
 * @internal
 */
export class GltfPipelineLegacy {
  static async process(gltf: any) {
    let rtcPosition;
    const extensions = gltf.extensions;
    if (extensions) {
      // If it is used, extract the CesiumRTC extension and add it back after processing
      const cesiumRTC = extensions.CESIUM_RTC;
      if (cesiumRTC) {
        rtcPosition = Cartesian3.unpack(cesiumRTC.center);
      }
    }
    GltfPipelineLegacy.fixBatchIdSemantic(gltf);
    if (rtcPosition) {
      GltfPipelineLegacy.addCesiumRTC(gltf, {
        position: rtcPosition,
      });
    }
  }

  private static addCesiumRTC(gltf: any, options: any) {
    options = defaultValue(options, {});
    const positionArray: number[] = [];
    const ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
    let position = options.position;
    if (!defined(position)) {
      if (
        defined(options.longitude) &&
        defined(options.latitude) &&
        defined(options.height)
      ) {
        position = Cartesian3.fromRadians(
          options.longitude,
          options.latitude,
          options.height,
          ellipsoid
        );
      } else {
        throw new DeveloperError(
          "Either a position or lat/long/height must be provided"
        );
      }
    }
    Cartesian3.pack(position, positionArray);
    let extensions = gltf.extensions;
    if (!defined(extensions)) {
      extensions = {};
      gltf.extensions = extensions;
    }
    extensions.CESIUM_RTC = {
      center: positionArray,
    };
    Extensions.addExtensionRequired(gltf, "CESIUM_RTC");
  }

  private static fixBatchIdSemantic(gltf: any) {
    const meshes = gltf.meshes;
    for (const meshId in meshes) {
      if (Object.prototype.hasOwnProperty.call(meshes, meshId)) {
        const primitives = meshes[meshId].primitives;
        const primitivesLength = primitives.length;
        for (let i = 0; i < primitivesLength; ++i) {
          const attributes = primitives[i].attributes;
          if (attributes.BATCHID) {
            attributes._BATCHID = attributes.BATCHID;
            delete attributes.BATCHID;
          }
        }
      }
    }

    const techniques = gltf.techniques;
    for (const techniqueId in techniques) {
      if (Object.prototype.hasOwnProperty.call(techniques, techniqueId)) {
        const parameters = techniques[techniqueId].parameters;
        for (const parameterId in parameters) {
          if (Object.prototype.hasOwnProperty.call(parameters, parameterId)) {
            const parameter = parameters[parameterId];
            if (parameter.semantic === "BATCHID") {
              parameter.semantic = "_BATCHID";
            }
          }
        }
      }
    }
  }
}
