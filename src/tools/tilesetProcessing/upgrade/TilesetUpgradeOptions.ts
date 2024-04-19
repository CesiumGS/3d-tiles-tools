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
  // Options for the general upgrade process
  upgradeExternalTilesets: boolean;

  // Options for upgrading the `Tileset` object
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

  // Indicates whether the `3DTILES_content_gltf` extension
  // declaration should be removed, as part of an upgrade
  // to 1.1, where glTF is supported without an extension
  upgradeContentGltfExtensionDeclarations: boolean;

  // Options upgrading glTF from 1.0 to 2.0 in B3DM or I3DM tile content
  upgradeB3dmGltf1ToGltf2: boolean;
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
};
