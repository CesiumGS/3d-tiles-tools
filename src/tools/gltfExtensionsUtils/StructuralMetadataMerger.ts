import crypto from "crypto";

import { Document } from "@gltf-transform/core";
import { Property } from "@gltf-transform/core";
import { IProperty } from "@gltf-transform/core";

import { StructuralMetadata } from "../../gltf-extensions/";
import { StructuralMetadataSchema as Schema } from "../../gltf-extensions/";
import { StructuralMetadataClass as Class } from "../../gltf-extensions/";
import { EXTStructuralMetadata } from "../../gltf-extensions/";

import { copyToDocument } from "./StructuralMetadataMergeUtilities";

import { MetadataError } from "../../metadata";
import { Loggers } from "../../base/";

const logger = Loggers.get("gltfExtensionsUtils");
logger.level = "debug";

// TODO This logging is for first drafts/experiments only!
function log(object: any) {
  //logger.info(object);
  console.log(object);
}

/**
 * A class for merging two glTF-Transform documents that may contain
 * the `EXT_structural_metadata` extension.
 */
export class StructuralMetadataMerger {
  /**
   * Merge two glTF-Transform documents, taking into account that
   * they might contain the `EXT_structural_metadata` extension.
   *
   * This will perform a default `document.merge` operation, but apply
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
    targetDocument.merge(sourceDocument);

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
      copyToDocument(targetDocument, sourceDocument, [
        sourceStructuralMetadata,
      ]);
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
        schemaUriResolver
      );
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
   * @param schemaUriResolver - A function that can resolve the `schemaUri`
   * and return the metadata schema JSON object
   * @returns A promise that resolves when the operation is finished
   */
  private static async mergeStructuralMetadata(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata,
    sourceDocument: Document,
    sourceStructuralMetadata: StructuralMetadata,
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
    const oldClassKeys = targetSchema.listClassKeys();
    const oldEnumKeys = targetSchema.listEnumKeys();

    const sourceClassNamesInTarget = StructuralMetadataMerger.mergeSchemas(
      targetDocument,
      targetSchema,
      sourceDocument,
      sourceSchema
    );

    const newClassKeys = targetSchema.listClassKeys();
    const newEnumKeys = targetSchema.listEnumKeys();
    if (oldClassKeys != newClassKeys || oldEnumKeys != newEnumKeys) {
      const newId = "SCHEMA-ID-" + crypto.randomUUID();
      log("Target schema was modified - assigning ID " + newId);
      targetSchema.setId(newId);
    }

    log("Merging property tables...");
    StructuralMetadataMerger.mergePropertyTables(
      targetDocument,
      targetStructuralMetadata,
      sourceDocument,
      sourceStructuralMetadata,
      sourceClassNamesInTarget
    );

    log("Merging property textures...");
    StructuralMetadataMerger.mergePropertyTextures(
      targetDocument,
      targetStructuralMetadata,
      sourceDocument,
      sourceStructuralMetadata,
      sourceClassNamesInTarget
    );

    log("Merging property attributes...");
    StructuralMetadataMerger.mergePropertyAttributes(
      targetDocument,
      targetStructuralMetadata,
      sourceDocument,
      sourceStructuralMetadata,
      sourceClassNamesInTarget
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
   * @param targetDocument - The target document
   * @param targetStructuralMetadata - The target extension object
   * @param sourceDocument - The source document
   * @param sourceStructuralMetadata - The source extension object
   * @param sourceClassNamesInTarget - The mapping from class names in
   * the source schema to the names that they have in the target schema.
   */
  private static mergePropertyTables(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata,
    sourceDocument: Document,
    sourceStructuralMetadata: StructuralMetadata,
    sourceClassNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyTables = sourceStructuralMetadata.listPropertyTables();
    const targetPropertyTables = StructuralMetadataMerger.copyArray(
      targetDocument,
      sourceDocument,
      sourcePropertyTables
    );
    for (const targetPropertyTable of targetPropertyTables) {
      const sourceClassName = targetPropertyTable.getClass();
      const targetClassName = sourceClassNamesInTarget[sourceClassName];
      log(
        "Property table referred to class " +
          sourceClassName +
          " and now refers to class " +
          targetClassName
      );
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
   * @param targetDocument - The target document
   * @param targetStructuralMetadata - The target extension object
   * @param sourceDocument - The source document
   * @param sourceStructuralMetadata - The source extension object
   * @param sourceClassNamesInTarget - The mapping from class names in
   * the source schema to the names that they have in the target schema.
   */
  private static mergePropertyTextures(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata,
    sourceDocument: Document,
    sourceStructuralMetadata: StructuralMetadata,
    sourceClassNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyTextures =
      sourceStructuralMetadata.listPropertyTextures();
    const targetPropertyTextures = StructuralMetadataMerger.copyArray(
      targetDocument,
      sourceDocument,
      sourcePropertyTextures
    );
    for (const targetPropertyTexture of targetPropertyTextures) {
      const sourceClassName = targetPropertyTexture.getClass();
      const targetClassName = sourceClassNamesInTarget[sourceClassName];
      log(
        "Property texture referred to class " +
          sourceClassName +
          " and now refers to class " +
          targetClassName
      );
      targetPropertyTexture.setClass(targetClassName);
      targetStructuralMetadata.addPropertyTexture(targetPropertyTexture);
    }
  }

  /**
   * Merge the property attributes from the given source to the given targets.
   *
   * This will update the 'class' of the copied property attributes according
   * to the given name mapping.
   *
   * @param targetDocument - The target document
   * @param targetStructuralMetadata - The target extension object
   * @param sourceDocument - The source document
   * @param sourceStructuralMetadata - The source extension object
   * @param sourceClassNamesInTarget - The mapping from class names in
   * the source schema to the names that they have in the target schema.
   */
  private static mergePropertyAttributes(
    targetDocument: Document,
    targetStructuralMetadata: StructuralMetadata,
    sourceDocument: Document,
    sourceStructuralMetadata: StructuralMetadata,
    sourceClassNamesInTarget: { [key: string]: string }
  ) {
    const sourcePropertyAttributes =
      sourceStructuralMetadata.listPropertyAttributes();
    const targetPropertyAttributes = StructuralMetadataMerger.copyArray(
      targetDocument,
      sourceDocument,
      sourcePropertyAttributes
    );
    for (const targetPropertyAttribute of targetPropertyAttributes) {
      const sourceClassName = targetPropertyAttribute.getClass();
      const targetClassName = sourceClassNamesInTarget[sourceClassName];
      log(
        "Property attribute referred to class " +
          sourceClassName +
          " and now refers to class " +
          targetClassName
      );
      targetPropertyAttribute.setClass(targetClassName);
      targetStructuralMetadata.addPropertyAttribute(targetPropertyAttribute);
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
            " is stored as " +
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
            log("Source class " + sourceClassKey + " already exists ");
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
        if (sourceEnumType !== undefined) {
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
        if (sourceEnumType !== undefined) {
          const targetEnumType = sourceEnumNamesInTarget[sourceEnumType];
          targetProperty.setEnumType(targetEnumType);
        }
      }
    }
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
   * Copy an array of objects from the given source document to the
   * given target document, and return the copies.
   *
   * @param targetDocument - The target document
   * @param sourceDocument - The source document
   * @param sourceElement - The source objects
   * @returns The target objects
   */
  private static copyArray<T extends Property<IProperty>>(
    targetDocument: Document,
    sourceDocument: Document,
    sourceElements: T[]
  ): T[] {
    const mapping = copyToDocument(
      targetDocument,
      sourceDocument,
      sourceElements
    );
    const targetElements = sourceElements.map((e: T) => mapping.get(e) as T);
    return targetElements;
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
