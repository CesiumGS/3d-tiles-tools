/**
 * The options for the tileset upgrade. This is only used internally,
 * as a collection of flags to enable/disable certain parts
 * of the update.
 *
 * The exact set of options (and how they may eventually
 * be exposed to the user) still have to be decided.
 */
export type TilesetUpgradeOptions = {
  upgradeAssetVersionNumber: boolean;
  upgradeRefineCase: boolean;
  upgradeContentUrlToUri: boolean;
  upgradeB3dmGltf1ToGltf2: boolean;
  upgradeI3dmGltf1ToGltf2: boolean;
  upgradeExternalTilesets: boolean;
  upgradeExtensionDeclarations: boolean;
};
