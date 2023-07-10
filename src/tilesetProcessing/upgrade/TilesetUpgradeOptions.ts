/**
 * The options for the tileset upgrade. This is only used internally,
 * as a collection of flags to enable/disable certain parts
 * of the update.
 *
 * The exact set of options (and how they may eventually
 * be exposed to the user) still have to be decided.
 */
export type TilesetUpgradeOptions = {
  // Options for the general upgrade process
  upgradeExternalTilesets: boolean;

  // Options for upgrading the `Tileset` object
  upgradeAssetVersionNumber: boolean;
  upgradeRefineCase: boolean;
  upgradeContentUrlToUri: boolean;
  upgradeExtensionDeclarations: boolean;

  // Options for the tile content
  upgradeB3dmGltf1ToGltf2: boolean;
  upgradeI3dmGltf1ToGltf2: boolean;

  upgradePntsToGlb: boolean;
  upgradeB3dmToGlb: boolean;
};
