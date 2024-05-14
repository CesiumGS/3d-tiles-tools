import crypto from "crypto";

import { Document } from "@gltf-transform/core";
import { Property } from "@gltf-transform/core";
import { IProperty } from "@gltf-transform/core";

import { unpartition } from "@gltf-transform/functions";

import { EXTStructuralMetadata } from "../../gltf-extensions/";
import { StructuralMetadata } from "../../gltf-extensions/";
import { MeshPrimitiveStructuralMetadata } from "../../gltf-extensions/";
import { StructuralMetadataSchema as Schema } from "../../gltf-extensions/";
import { StructuralMetadataClass as Class } from "../../gltf-extensions/";
import { StructuralMetadataPropertyTable as PropertyTable } from "../../gltf-extensions/";
import { StructuralMetadataPropertyTexture as PropertyTexture } from "../../gltf-extensions/";
import { StructuralMetadataPropertyAttribute as PropertyAttribute } from "../../gltf-extensions/";

import { mergeDocuments } from "./StructuralMetadataMergeUtilities";
import { copyToDocument } from "./StructuralMetadataMergeUtilities";

import { MetadataError } from "../../metadata";
import { Loggers } from "../../base/";

const logger = Loggers.get("gltfExtensionsUtils");
function log(object: any) {
  logger.debug(object);
}

/**
 * A class for merging two glTF-Transform documents that may contain
 * the `EXT_structural_metadata` extension.
 *
 * @internal
 */
export class StructuralMetadataMerger {
  /**
   * A suffix that will be appended to an unspecified schema ID
   * for merged schemas. This is ONLY used for unit tests.
   */
  private static mergedSchemaIdSuffix: string | undefined = undefined;

  /**
   * Set a suffix that will be appended to an unspecified schema ID
   * for merged schemas. This is ONLY used for unit tests. Clients
   * should never call this function.
   *
   * @param mergedSchemaIdSuffix - The suffix for merged schema IDs
   */
  static setMergedSchemaIdSuffix(mergedSchemaIdSuffix: string | undefined) {
    StructuralMetadataMerger.mergedSchemaIdSuffix = mergedSchemaIdSuffix;
  }

  /**
   * Merge two glTF-Transform documents, taking into account that
   * they might contain the `EXT_structural_metadata` extension.
   *
   * This will perform a default merge operation, but apply
   * special treatment for the case that either or both of the documents
   * contain the extension: It will merge the top-level extension
   * object, and assign the merged one to the root of the target
   * document.
   *
   * @param targetDocument - The target document
   * @param sourceDocument - The source document
   * @param schemaUriResolver - A function that can resolve the `schemaUri`
   * and return the metadata schema JSON object
   * @returns A promise that resolves when the operation is finished
   */
  static async mergeDocumentsWithStructuralMetadata(
    targetDocument: Document,
    sourceDocument: Document,
    schemaUriResolver: (schemaUri: string) => Promise<any>
  ) {
    const targetRoot = targetDocument.getRoot();
    const sourceRoot = sourceDocument.getRoot();
    const targetStructuralMetadata =
      targetRoot.getExtension<StructuralMetadata>("EXT_structural_metadata");
    const sourceStructuralMetadata =
      sourceRoot.getExtension<StructuralMetadata>("EXT_structural_metadata");
    const mainMergeMap = mergeDocuments(targetDocument, sourceDocument);

    // Early bailout for the cases where NOT BOTH of the documents
    // contain the extension
    if (
      targetStructuralMetadata === null &&
      sourceStructuralMetadata === null
    ) {
      log(
        "Neither source nor target contain structural metadata - nothing to do"
      );
      return;
    }

    if (
      targetStructuralMetadata !== null &&
      sourceStructuralMetadata === null
    ) {
      log("Only target contains structural metadata - nothing to do");
      return;
    }

    if (
      targetStructuralMetadata === null &&
      sourceStructuralMetadata !== null
    ) {
      log(
        "Only source contains structural metadata - copying source to target"
      );

      // The default glTF-Transform merge operation will copy the
      // structural metadata (and store the mapping from the source
      // to the target object), but it will not assign the extension
      // object to the target root. So here, the copied object is
      // obtained from the merge mapping, and assigned to the target
      const targetRoot = targetDocument.getRoot();
      const copiedStructuralMetadata = mainMergeMap.get(
        sourceStructuralMetadata
      ) as StructuralMetadata;
      targetRoot.setExtension<StructuralMetadata>(
        "EXT_structural_metadata",
        copiedStructuralMetadata
      );

      // For the copied metadata, ensure that it does not use a schemaUri
      // any more, but instead, contains the inlined schema directly
      const copiedSchemaUri = copiedStructuralMetadata.getSchemaUri();
      if (copiedSchemaUri !== null) {
        const targetExtStructuralMetadata = targetDocument.createExtension(
          EXTStructuralMetadata
        );
        const copiedSchemaJson = await schemaUriResolver(copiedSchemaUri);
        const copiedSchema =
          targetExtStructuralMetadata.createSchemaFrom(copiedSchemaJson);
        copiedStructuralMetadata.setSchema(copiedSchema);
        copiedStructuralMetadata.setSchemaUri(null);
      }

      await targetDocument.transform(unpartition());
      return;
    }

    // The only case where special treatment is required is when
    // both documents contain the extension:
    if (
      targetStructuralMetadata !== null &&
      sourceStructuralMetadata !== null
    ) {
      log("Source and target contain structural metadata - merging");
      await StructuralMetadataMerger.mergeStructuralMetadata(
        targetDocument,
        targetStructuralMetadata,
        sourceDocument,
        sourceStructuralMetadata,
        mainMergeMap,
        schemaUriResolver
      );
      await targetDocument.transform(unpartition());
    }
  }

  /**
   * Merge the given `EXT_structural_metadata` extension objects from
   * the given documents, and assign the result to the given
   * target document.
   *
   * @param targetDocument - The target document
   * @param targetStructuralMetadata - The target extension object
   * @param sourceDocument - The source document
   * @param sourceStructuralMetadata - The source extension object
   * @param mainMergeMap - The map from `mergeDocuments`
   * @param schemaUriResolver - A function that can resolve the `schemaUri`
   * and return the metadata schema JSON object
   * @returns A promise that resolves when the operation is finished
   */
  private static async mergeStructuralMetadata(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata,
    sourceDocument: Document,
    sourceStructuralMetadata: StructuralMetadata,
    mainMergeMap: Map<Property, Property>,
    schemaUriResolver: (schemaUri: string) => Promise<any>
  ) {
    const targetExtStructuralMetadata = targetDocument.createExtension(
      EXTStructuralMetadata
    );

    // Obtain the Schema objects from the source and the target,
    // creating the objects from the results of resolving the
    // schemaUri where necessary.

    let sourceSchema: Schema | null;
    const sourceSchemaUri = sourceStructuralMetadata.getSchemaUri();
    if (sourceSchemaUri !== null) {
      const sourceSchemaJson = await schemaUriResolver(sourceSchemaUri);
      // TODO Will the fact that the TARGET extension object
      // is used here cause trouble when running copyToDocument?
      // In any case, the object should NOT be created in the
      // source (because the source should not be modified!)
      sourceSchema =
        targetExtStructuralMetadata.createSchemaFrom(sourceSchemaJson);
    } else {
      sourceSchema = sourceStructuralMetadata.getSchema();
    }

    let targetSchema: Schema | null;
    const targetSchemaUri = targetStructuralMetadata.getSchemaUri();
    if (targetSchemaUri !== null) {
      const targetSchemaJson = await schemaUriResolver(targetSchemaUri);
      targetSchema =
        targetExtStructuralMetadata.createSchemaFrom(targetSchemaJson);

      // If the target schema was resolved from a URI, then assign
      // the newly created object to the target, and set the
      // schemaUri of the target to null
      targetStructuralMetadata.setSchema(targetSchema);
      targetStructuralMetadata.setSchemaUri(null);
    } else {
      targetSchema = targetStructuralMetadata.getSchema();
    }

    if (sourceSchema === null) {
      throw new MetadataError("Source schema could not be loaded");
    }
    if (targetSchema === null) {
      throw new MetadataError("Target schema could not be loaded");
    }

    log("Merging schemas...");

    // Store the names/keys of the classes and enums in the
    // target, as a baseline way of identifying whether
    // the target schema changes during the merge
    const oldClassKeys = targetSchema.listClassKeys();
    const oldEnumKeys = targetSchema.listEnumKeys();

    const sourceClassNamesInTarget = StructuralMetadataMerger.mergeSchemas(
      targetDocument,
      targetSchema,
      sourceDocument,
      sourceSchema
    );

    // If new classes or enums have been added, then assign
    // a new ID to the schema
    const newClassKeys = targetSchema.listClassKeys();
    const newEnumKeys = targetSchema.listEnumKeys();
    if (oldClassKeys != newClassKeys || oldEnumKeys != newEnumKeys) {
      let schemaIdSuffix = StructuralMetadataMerger.mergedSchemaIdSuffix;
      if (schemaIdSuffix === undefined) {
        schemaIdSuffix = crypto.randomUUID();
      }
      schemaIdSuffix = schemaIdSuffix.replace(/-/g, "_");
      const newId = "SCHEMA_ID_" + schemaIdSuffix;
      log("Target schema was modified - assigning ID " + newId);
      targetSchema.setId(newId);
    }

    log("Merging property tables...");
    StructuralMetadataMerger.mergePropertyTables(
      targetStructuralMetadata,
      sourceStructuralMetadata,
      mainMergeMap,
      sourceClassNamesInTarget
    );

    log("Merging property textures...");
    StructuralMetadataMerger.mergePropertyTextures(
      targetStructuralMetadata,
      sourceStructuralMetadata,
      mainMergeMap,
      sourceClassNamesInTarget
    );
    log("Updating mesh primitive property textures...");
    StructuralMetadataMerger.updateMeshPrimitivesPropertyTextures(
      targetDocument,
      targetStructuralMetadata
    );

    log("Merging property attributes...");
    StructuralMetadataMerger.mergePropertyAttributes(
      targetStructuralMetadata,
      sourceStructuralMetadata,
      mainMergeMap,
      sourceClassNamesInTarget
    );
    log("Updating mesh primitive property attributes...");
    StructuralMetadataMerger.updateMeshPrimitivesPropertyAttributes(
      targetDocument,
      targetStructuralMetadata
    );

    const targetRoot = targetDocument.getRoot();
    targetRoot.setExtension<StructuralMetadata>(
      "EXT_structural_metadata",
      targetStructuralMetadata
    );
  }

  /**
   * Merge the property tables from the given source to the given targets.
   *
   * This will update the 'class' of the copied property tables according
   * to the given name mapping.
   *
   * @param targetStructuralMetadata - The target extension object
   * @param sourceStructuralMetadata - The source extension object
   * @param mainMergeMap - The mapping from `mergeDocuments`
   * @param sourceClassNamesInTarget - The mapping from class names in
   * the source schema to the names that they have in the target schema.
   */
  private static mergePropertyTables(
    targetStructuralMetadata: StructuralMetadata,
    sourceStructuralMetadata: StructuralMetadata,
    mainMergeMap: Map<Property, Property>,
    sourceClassNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyTables = sourceStructuralMetadata.listPropertyTables();
    for (const sourcePropertyTable of sourcePropertyTables) {
      const sourceClassName = sourcePropertyTable.getClass();
      const targetClassName = sourceClassNamesInTarget[sourceClassName];
      log(
        "Property table referred to class " +
          sourceClassName +
          " and now refers to class " +
          targetClassName
      );
      const targetPropertyTable = mainMergeMap.get(
        sourcePropertyTable
      ) as PropertyTable;
      targetPropertyTable.setClass(targetClassName);
      targetStructuralMetadata.addPropertyTable(targetPropertyTable);
    }
  }

  /**
   * Merge the property textures from the given source to the given targets.
   *
   * This will update the 'class' of the copied property textures according
   * to the given name mapping.
   *
   * The given target structural metadata will afterwards contain the set
   * of unique textures. This means that when there are two textures
   * that are `equal` according to the glTF-Transform `Property.equal`
   * implementation, then the texture will only be added once to the
   * target.
   *
   * @param targetStructuralMetadata - The target extension object
   * @param sourceStructuralMetadata - The source extension object
   * @param mainMergeMap  - The mapping from `mergeDocuments`
   * @param sourceClassNamesInTarget - The mapping from class names in
   * the source schema to the names that they have in the target schema.
   */
  private static mergePropertyTextures(
    targetStructuralMetadata: StructuralMetadata,
    sourceStructuralMetadata: StructuralMetadata,
    mainMergeMap: Map<Property, Property>,
    sourceClassNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyTextures =
      sourceStructuralMetadata.listPropertyTextures();
    const targetPropertyTextures =
      targetStructuralMetadata.listPropertyTextures();
    for (const sourcePropertyTexture of sourcePropertyTextures) {
      const sourceClassName = sourcePropertyTexture.getClass();
      const targetClassName = sourceClassNamesInTarget[sourceClassName];
      log(
        "Property texture referred to class " +
          sourceClassName +
          " and now refers to class " +
          targetClassName
      );
      const targetPropertyTexture = mainMergeMap.get(
        sourcePropertyTexture
      ) as PropertyTexture;
      targetPropertyTexture.setClass(targetClassName);
      const alreadyExists = StructuralMetadataMerger.containsEqual(
        targetPropertyTextures,
        targetPropertyTexture
      );
      if (!alreadyExists) {
        targetPropertyTextures.push(targetPropertyTexture);
        targetStructuralMetadata.addPropertyTexture(targetPropertyTexture);
      }
    }
  }

  /**
   * Updates all mesh primitives to refer to the merged property textures.
   *
   * This will examine all mesh primitives in the given target document,
   * and check whether they contain the `EXT_structural_metadata` extension
   * object with property textures.
   *
   * If the extension object is found, then the property textures in
   * the target mesh primitive will be updated, using
   * `updateMeshPrimitivePropertyTextures`.
   *
   * @param targetDocument - The target document
   * @param targetStructuralMetadata - The target root extension object
   */
  private static updateMeshPrimitivesPropertyTextures(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata
  ) {
    const targetRootPropertyTextures =
      targetStructuralMetadata.listPropertyTextures();

    const targetRoot = targetDocument.getRoot();
    const targetMeshes = targetRoot.listMeshes();
    for (const targetMesh of targetMeshes) {
      const targetPrimitives = targetMesh.listPrimitives();
      for (const targetPrimitive of targetPrimitives) {
        const targetMeshPrimitiveStructuralMetadata =
          targetPrimitive.getExtension<MeshPrimitiveStructuralMetadata>(
            "EXT_structural_metadata"
          );
        if (targetMeshPrimitiveStructuralMetadata) {
          StructuralMetadataMerger.updateMeshPrimitivePropertyTextures(
            targetRootPropertyTextures,
            targetMeshPrimitiveStructuralMetadata
          );
        }
      }
    }
  }

  /**
   * Updates the extension object of a mesh primitive to refer to the
   * merged property textures.
   *
   * The property textures in the given extension object will be
   * cleared, and replaced by the property textures that have been
   * created in the root extension object, to ensure that the property
   * textures in the mesh primitive extension object are THE actual
   * PropertyTexture objects that also appear in the top-level
   * extension object.
   *
   * @param targetRootPropertyTextures - The property textures from
   * the root extension object of the target
   * @param targetMeshPrimitiveStructuralMetadata - The extension object
   * from a mesh primitive
   */
  private static updateMeshPrimitivePropertyTextures(
    targetRootPropertyTextures: PropertyTexture[],
    targetMeshPrimitiveStructuralMetadata: MeshPrimitiveStructuralMetadata
  ) {
    // Clear the property textures from the target mesh primitive
    const oldTargetMeshPrimitivePropertyTextures =
      targetMeshPrimitiveStructuralMetadata.listPropertyTextures();
    for (const oldTargetMeshPrimitivePropertyTexture of oldTargetMeshPrimitivePropertyTextures) {
      targetMeshPrimitiveStructuralMetadata.removePropertyTexture(
        oldTargetMeshPrimitivePropertyTexture
      );
    }

    // Go through the list of old property texture objects,
    // and replace them with the ones from the root extension
    // object that are 'equal' to the old ones. (They will
    // not be 'identical', as in '==' or '===' - what counts
    // here is equality in the sense of the glTF-Transform
    // `Property.equals` function)
    for (const oldTargetMeshPrimitivePropertyTexture of oldTargetMeshPrimitivePropertyTextures) {
      let newTargetMeshPrimitivePropertyTexture: PropertyTexture | null = null;
      for (let i = 0; i < targetRootPropertyTextures.length; i++) {
        if (
          oldTargetMeshPrimitivePropertyTexture.equals(
            targetRootPropertyTextures[i]
          )
        ) {
          newTargetMeshPrimitivePropertyTexture = targetRootPropertyTextures[i];
          break;
        }
      }
      if (newTargetMeshPrimitivePropertyTexture === null) {
        throw new MetadataError(
          "Could not find mesh primitive property texture in root extension object"
        );
      } else {
        targetMeshPrimitiveStructuralMetadata.addPropertyTexture(
          newTargetMeshPrimitivePropertyTexture
        );
      }
    }
  }

  /**
   * Merge the property attributes from the given source to the given targets.
   *
   * This will update the 'class' of the copied property attributes according
   * to the given name mapping.
   *
   * The given target structural metadata will afterwards contain the set
   * of unique attributes. This means that when there are two attributes
   * that are `equal` according to the glTF-Transform `Property.equal`
   * implementation, then the attribute will only be added once to the
   * target.
   *
   * @param targetStructuralMetadata - The target extension object
   * @param sourceStructuralMetadata - The source extension object
   * @param mainMergeMap - The mapping from `mergeDocuments`
   * @param sourceClassNamesInTarget - The mapping from class names in
   * the source schema to the names that they have in the target schema.
   */
  private static mergePropertyAttributes(
    targetStructuralMetadata: StructuralMetadata,
    sourceStructuralMetadata: StructuralMetadata,
    mainMergeMap: Map<Property, Property>,
    sourceClassNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyAttributes =
      sourceStructuralMetadata.listPropertyAttributes();
    const targetPropertyAttributes =
      targetStructuralMetadata.listPropertyAttributes();
    for (const sourcePropertyAttribute of sourcePropertyAttributes) {
      const sourceClassName = sourcePropertyAttribute.getClass();
      const targetClassName = sourceClassNamesInTarget[sourceClassName];
      log(
        "Property attribute referred to class " +
          sourceClassName +
          " and now refers to class " +
          targetClassName
      );
      const targetPropertyAttribute = mainMergeMap.get(
        sourcePropertyAttribute
      ) as PropertyAttribute;
      targetPropertyAttribute.setClass(targetClassName);
      const alreadyExists = StructuralMetadataMerger.containsEqual(
        targetPropertyAttributes,
        targetPropertyAttribute
      );
      if (!alreadyExists) {
        targetPropertyAttributes.push(targetPropertyAttribute);
        targetStructuralMetadata.addPropertyAttribute(targetPropertyAttribute);
      }
    }
  }

  /**
   * Updates all mesh primitives to refer to the merged property attributes.
   *
   * This will examine all mesh primitives in the given target document,
   * and check whether they contain the `EXT_structural_metadata` extension
   * object with property attributes.
   *
   * If the extension object is found, then the property attributes in
   * the target mesh primitive will be updated, using
   * `updateMeshPrimitivePropertyAttributes`.
   *
   * @param targetDocument - The target document
   * @param targetStructuralMetadata - The target root extension object
   */
  private static updateMeshPrimitivesPropertyAttributes(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata
  ) {
    const targetRootPropertyAttributes =
      targetStructuralMetadata.listPropertyAttributes();

    const targetRoot = targetDocument.getRoot();
    const targetMeshes = targetRoot.listMeshes();
    for (const targetMesh of targetMeshes) {
      const targetPrimitives = targetMesh.listPrimitives();
      for (const targetPrimitive of targetPrimitives) {
        const targetMeshPrimitiveStructuralMetadata =
          targetPrimitive.getExtension<MeshPrimitiveStructuralMetadata>(
            "EXT_structural_metadata"
          );
        if (targetMeshPrimitiveStructuralMetadata) {
          StructuralMetadataMerger.updateMeshPrimitivePropertyAttributes(
            targetRootPropertyAttributes,
            targetMeshPrimitiveStructuralMetadata
          );
        }
      }
    }
  }

  /**
   * Updates the extension object of a mesh primitive to refer to the
   * merged property attributes.
   *
   * The property attributes in the given extension object will be
   * cleared, and replaced by the property attributes that have been
   * created in the root extension object, to ensure that the property
   * attributes in the mesh primitive extension object are THE actual
   * PropertyAttribute objects that also appear in the top-level
   * extension object.
   *
   * @param targetRootPropertyAttributes - The property attributes from
   * the root extension object of the target
   * @param targetMeshPrimitiveStructuralMetadata - The extension object
   * from a mesh primitive
   */
  private static updateMeshPrimitivePropertyAttributes(
    targetRootPropertyAttributes: PropertyAttribute[],
    targetMeshPrimitiveStructuralMetadata: MeshPrimitiveStructuralMetadata
  ) {
    // Clear the property attributes from the target mesh primitive
    const oldTargetMeshPrimitivePropertyAttributes =
      targetMeshPrimitiveStructuralMetadata.listPropertyAttributes();
    for (const oldTargetMeshPrimitivePropertyAttribute of oldTargetMeshPrimitivePropertyAttributes) {
      targetMeshPrimitiveStructuralMetadata.removePropertyAttribute(
        oldTargetMeshPrimitivePropertyAttribute
      );
    }

    // Go through the list of old property attribute objects,
    // and replace them with the ones from the root extension
    // object that are 'equal' to the old ones. (They will
    // not be 'identical', as in '==' or '===' - what counts
    // here is equality in the sense of the glTF-Transform
    // `Property.equals` function)
    for (const oldTargetMeshPrimitivePropertyAttribute of oldTargetMeshPrimitivePropertyAttributes) {
      let newTargetMeshPrimitivePropertyAttribute: PropertyAttribute | null =
        null;
      for (let i = 0; i < targetRootPropertyAttributes.length; i++) {
        if (
          oldTargetMeshPrimitivePropertyAttribute.equals(
            targetRootPropertyAttributes[i]
          )
        ) {
          newTargetMeshPrimitivePropertyAttribute =
            targetRootPropertyAttributes[i];
          break;
        }
      }
      if (newTargetMeshPrimitivePropertyAttribute === null) {
        throw new MetadataError(
          "Could not find mesh primitive property attribute in root extension object"
        );
      } else {
        targetMeshPrimitiveStructuralMetadata.addPropertyAttribute(
          newTargetMeshPrimitivePropertyAttribute
        );
      }
    }
  }

  /**
   * Merge the given `EXT_structural_metadata` schema objects from
   * the given documents.
   *
   * This will merge the enums and classes from the source schema
   * into the target schema, performing renaming operations for
   * disambiguation as necessary.
   *
   * The method will return a mapping from class names in the source
   * schema to the names that they have in the target schema.
   *
   * @param targetDocument - The target document
   * @param targetSchema - The target schema
   * @param sourceDocument - The source document
   * @param sourceSchema - The source schema
   * @returns A mapping from class names in the source schema to the
   * names that they have in the target schema.
   */
  private static mergeSchemas(
    targetDocument: Document,
    targetSchema: Schema,
    sourceDocument: Document,
    sourceSchema: Schema
  ): { [key: string]: string } {
    const sourceEnumNamesInTarget = StructuralMetadataMerger.mergeSchemaEnums(
      targetDocument,
      targetSchema,
      sourceDocument,
      sourceSchema
    );
    const sourceClassNamesInTarget =
      StructuralMetadataMerger.mergeSchemaClasses(
        targetDocument,
        targetSchema,
        sourceDocument,
        sourceSchema,
        sourceEnumNamesInTarget
      );
    return sourceClassNamesInTarget;
  }

  /**
   * Merge the set of enums from given source schema into the given target.
   *
   * This will perform renaming operations for disambiguation as
   * necessary. The method will return a mapping from enum names in
   * the source schema to the names that they have in the target schema.
   *
   * @param targetDocument - The target document
   * @param targetSchema - The target schema
   * @param sourceDocument - The source document
   * @param sourceSchema - The source schema
   * @returns A mapping from enum names in the source schema to the
   * names that they have in the target schema.
   */
  private static mergeSchemaEnums(
    targetDocument: Document,
    targetSchema: Schema,
    sourceDocument: Document,
    sourceSchema: Schema
  ) {
    const sourceEnumNamesInTarget: { [key: string]: string } = {};

    const sourceEnumKeys = sourceSchema.listEnumKeys();
    const targetEnumKeys = targetSchema.listEnumKeys();
    const allEnumKeys = [...targetEnumKeys];
    for (const sourceEnumKey of sourceEnumKeys) {
      const sourceEnum = sourceSchema.getEnum(sourceEnumKey);
      if (sourceEnum === null) {
        throw new MetadataError("Source Enum " + sourceEnumKey + " not found");
      }
      let targetEnum = targetSchema.getEnum(sourceEnumKey);
      if (targetEnum === null) {
        // The target schema does not yet contain an enum that has
        // the same name as the source enum. Copy the source enum
        // to the target
        targetEnum = StructuralMetadataMerger.copySingle(
          targetDocument,
          sourceDocument,
          sourceEnum
        );
        targetSchema.setEnum(sourceEnumKey, targetEnum);
        log("Source enum " + sourceEnumKey + " is directly copied to target");
        sourceEnumNamesInTarget[sourceEnumKey] = sourceEnumKey;
      } else if (sourceEnum.equals(targetEnum)) {
        // The target schema already contains an enum that has the
        // same name as the source enum, but it is structurally
        // equal. Nothing has to be done here
        log(
          "Source enum " +
            sourceEnumKey +
            " is equal to the one that already exists in the target"
        );
        sourceEnumNamesInTarget[sourceEnumKey] = sourceEnumKey;
      } else {
        // The target schema already contains an enum that has the
        // same name as the source enum, AND that has a different
        // structure. Copy the source enum for the target, but
        // store it under a different name
        targetEnum = StructuralMetadataMerger.copySingle(
          targetDocument,
          sourceDocument,
          sourceEnum
        );
        const targetEnumKey = StructuralMetadataMerger.disambiguate(
          sourceEnumKey,
          allEnumKeys
        );
        allEnumKeys.push(targetEnumKey);
        targetSchema.setEnum(targetEnumKey, targetEnum);
        log(
          "Source enum " +
            sourceEnumKey +
            " is copied and stored as " +
            targetEnumKey +
            " in the target"
        );
        sourceEnumNamesInTarget[sourceEnumKey] = targetEnumKey;
      }
    }
    return sourceEnumNamesInTarget;
  }

  /**
   * Merge the set of classes from given source schema into the given target.
   *
   * This will perform renaming operations for disambiguation as
   * necessary. This will include any renamings that are caused by
   * enums that have already been renamed: When a source class refers
   * to an enum that has been renamed, then the corresponding enumName
   * properties will be updated accordingly, and it will be added as
   * a new class to the target.
   *
   * The method will return a mapping from class names in
   * the source schema to the names that they have in the target schema.
   *
   * @param targetDocument - The target document
   * @param targetSchema - The target schema
   * @param sourceDocument - The source document
   * @param sourceSchema - The source schema
   * @param sourceEnumNamesInTarget - A mapping from enum names in the
   * source schema to the names that they have in the target schema.
   * @returns A mapping from class names in the source schema to the
   * names that they have in the target schema.
   */
  private static mergeSchemaClasses(
    targetDocument: Document,
    targetSchema: Schema,
    sourceDocument: Document,
    sourceSchema: Schema,
    sourceEnumNamesInTarget: { [key: string]: string }
  ) {
    const sourceClassNamesInTarget: { [key: string]: string } = {};
    const sourceClassKeys = sourceSchema.listClassKeys();
    const targetClassKeys = targetSchema.listClassKeys();
    const allClassKeys = [...targetClassKeys];
    for (const sourceClassKey of sourceClassKeys) {
      const sourceClass = sourceSchema.getClass(sourceClassKey);
      if (sourceClass === null) {
        throw new MetadataError(
          "Source class " + sourceClassKey + " not found"
        );
      }
      const existingTargetClass = targetSchema.getClass(sourceClassKey);
      if (existingTargetClass === null) {
        // The target schema does not yet contain a class that has
        // the same name as the source class. Copy the source class
        // to the target
        const targetClass = StructuralMetadataMerger.copySingle(
          targetDocument,
          sourceDocument,
          sourceClass
        );
        StructuralMetadataMerger.updateEnumTypes(
          targetClass,
          sourceEnumNamesInTarget
        );
        targetSchema.setClass(sourceClassKey, targetClass);
        log(
          "Source class " +
            sourceClassKey +
            " is directly copied to target (possibly with updated enum types)"
        );
        sourceClassNamesInTarget[sourceClassKey] = sourceClassKey;
      } else {
        // The target schema already contains a class that has the
        // same name as the source class.

        // If the source class contains a property that has a "enumType"
        // that was renamed, then the the target class is created by
        // copying the source to the target, updating the respective
        // enumType values, and storing it under a new name
        if (
          StructuralMetadataMerger.containsRenamedEnumType(
            sourceClass,
            sourceEnumNamesInTarget
          )
        ) {
          const targetClass = StructuralMetadataMerger.copySingle(
            targetDocument,
            sourceDocument,
            sourceClass
          );
          const targetClassKey = StructuralMetadataMerger.disambiguate(
            sourceClassKey,
            allClassKeys
          );
          allClassKeys.push(targetClassKey);
          StructuralMetadataMerger.updateEnumTypes(
            targetClass,
            sourceEnumNamesInTarget
          );
          targetSchema.setClass(targetClassKey, targetClass);
          log(
            "Source class " +
              sourceClassKey +
              " is copied to target due to renamed enum types, and stored as " +
              targetClassKey
          );
          sourceClassNamesInTarget[sourceClassKey] = targetClassKey;
        } else {
          // The target schema already contains a class that has the
          // same name as the source class, and does not involve any
          // renamed enumType
          if (sourceClass.equals(existingTargetClass)) {
            // When the source class and the existing target class
            // are equal, then nothing has to be done
            log(
              "Source class " +
                sourceClassKey +
                " is equal to one that already exists in the target"
            );
            sourceClassNamesInTarget[sourceClassKey] = sourceClassKey;
          } else {
            // Otherwise, the source class is copied to the target and
            // stored under a different name
            const targetClass = StructuralMetadataMerger.copySingle(
              targetDocument,
              sourceDocument,
              sourceClass
            );
            const targetClassKey = StructuralMetadataMerger.disambiguate(
              sourceClassKey,
              allClassKeys
            );
            allClassKeys.push(targetClassKey);
            StructuralMetadataMerger.updateEnumTypes(
              targetClass,
              sourceEnumNamesInTarget
            );
            targetSchema.setClass(targetClassKey, targetClass);
            log(
              "Source class " +
                sourceClassKey +
                " is copied to target and stored as " +
                targetClassKey
            );
            sourceClassNamesInTarget[sourceClassKey] = targetClassKey;
          }
        }
      }
    }
    return sourceClassNamesInTarget;
  }

  /**
   * Returns whether the given source class contains an enum-typed
   * property where the enum was renamed, according to the given
   * name mapping
   *
   * @param sourceClass - The source class
   * @param sourceEnumNamesInTarget - A mapping from enum names in the
   * source schema to the names that they have in the target schema.
   * @returns Whether the class contains a renamed enum type
   */
  private static containsRenamedEnumType(
    sourceClass: Class,
    sourceEnumNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyKeys = sourceClass.listPropertyKeys();
    for (const sourcePropertyKey of sourcePropertyKeys) {
      const sourceProperty = sourceClass.getProperty(sourcePropertyKey);
      if (sourceProperty) {
        const sourceEnumType = sourceProperty.getEnumType();
        if (sourceEnumType !== null) {
          const targetEnumType = sourceEnumNamesInTarget[sourceEnumType];
          if (targetEnumType !== sourceEnumType) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Updates the enumType of all enum-typed properties in the given
   * class, based on the given name mapping.
   *
   * @param targetClass - The target class
   * @param sourceEnumNamesInTarget - A mapping from enum names in the
   * source schema to the names that they have in the target schema.
   */
  private static updateEnumTypes(
    targetClass: Class,
    sourceEnumNamesInTarget: { [key: string]: string }
  ) {
    const targetPropertyKeys = targetClass.listPropertyKeys();
    for (const targetPropertyKey of targetPropertyKeys) {
      const targetProperty = targetClass.getProperty(targetPropertyKey);
      if (targetProperty) {
        const sourceEnumType = targetProperty.getEnumType();
        if (sourceEnumType !== null) {
          const targetEnumType = sourceEnumNamesInTarget[sourceEnumType];
          targetProperty.setEnumType(targetEnumType);
        }
      }
    }
  }

  /**
   * Returns whether the given array of glTF-Transform `Property` objects
   * contains an objec that is equal to the given one, based on the
   * glTF-Transform `Property.equal` implementation.
   *
   * @param properties - The properties
   * @param property - The property
   * @returns The result
   */
  private static containsEqual(properties: Property[], property: Property) {
    for (const p of properties) {
      if (p.equals(property)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Copy a single object from the given source document to the
   * given target document, and return the copy.
   *
   * @param targetDocument - The target document
   * @param sourceDocument - The source document
   * @param sourceElement - The source object
   * @returns The target object
   */
  private static copySingle<T extends Property<IProperty>>(
    targetDocument: Document,
    sourceDocument: Document,
    sourceElement: T
  ): T {
    const mapping = copyToDocument(targetDocument, sourceDocument, [
      sourceElement,
    ]);
    const targetElement = mapping.get(sourceElement) as T;
    return targetElement;
  }

  /**
   * Disambiguate the given name against the existing names.
   *
   * This will return a name that is based on the given input
   * name, but that does NOT yet appear in the given existing
   * names. It will NOT add the resulting name to the given
   * set. The exact disambiguation strategy is not specified.
   *
   * @param s - The input name
   * @param existing - The existing name
   * @returns - The disambiguated name
   */
  private static disambiguate(s: string, existing: string[]) {
    let result = s;
    let counter = 0;
    while (existing.includes(result)) {
      result = s + "_" + counter;
      counter++;
    }
    return result;
  }
}
