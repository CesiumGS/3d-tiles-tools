/**
 * The options for the tileset upgrade. This is only used internally,
 * as a collection of flags to enable/disable certain parts
 * of the upgrade.
 *
 * The exact set of options (and how they may eventually
 * be exposed to the user) still have to be decided.
 *
 * @internal
 */
export type TilesetUpgradeOptions = {
  // Whether the upgrade should be applied recursively
  // on external tilesets
  upgradeExternalTilesets: boolean;

  // The version number that should be inserted into the `asset`
  // of the upgraded tileset JSON (usually "1.0" or "1.1")
  upgradedAssetVersionNumber: string;

  // Whether the 'refine' value should be upgraded
  // to be in all-uppercase
  upgradeRefineCase: boolean;

  // Whether any `content.url` should be renamed
  // to `content.uri`
  upgradeContentUrlToUri: boolean;

  // Whether empty `tile.children` arrays should
  // be removed and become `undefined`
  upgradeEmptyChildrenToUndefined: true;

  // Whether the `asset.gltfUpAxis` declaration should
  // be removed if present. Note that this affects the
  // tileset JSON itself, as well as any upgrades of
  // glTF 1.0 to 2.0 data
  upgradeGltfUpAxis: true;

  // Indicates whether the `3DTILES_content_gltf` extension
  // declaration should be removed, as part of an upgrade
  // to 1.1, where glTF is supported without an extension
  upgradeContentGltfExtensionDeclarations: boolean;

  // Whether glTF 1.0 should be upgraded to glTF 2.0 in B3DM
  upgradeB3dmGltf1ToGltf2: boolean;

  // Whether glTF 1.0 should be upgraded to glTF 2.0 in I3DM
  upgradeI3dmGltf1ToGltf2: boolean;

  // Whether attempts should be made to convert PNTS files to GLB
  // with metadata
  upgradePntsToGlb: boolean;

  // Whether attempts should be made to convert B3DM files to GLB
  // with metadata
  upgradeB3dmToGlb: boolean;

  // Whether attempts should be made to convert I3DM files to GLB
  // with metadata
  upgradeI3dmToGlb: boolean;

  // Whether attempts should be made to convert CMPT files to GLB
  upgradeCmptToGlb: boolean;

  // Whether the CESIUM_RTC extension in glTF 1.0 or glTF 2.0 (!)
  // assets should be replaced by a translation of the root node.
  // Note that this only refers to tile content that is directly
  // referred to as `.gltf`/`.glb` files in 3D Tiles 1.1. When
  // the `upgradeB3dmToGlb` or `upgradeI3dmToGlm` flags are
  // `true`, then the conversion from B3DM/I3DM to GLB will
  // automatically include the CESIUM_RTC handling.
  upgradeCesiumRtcToRootTranslation: boolean;
};
