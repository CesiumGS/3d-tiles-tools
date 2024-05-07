// NOTE: The functions in this class are "ported" from
// https://github.com/donmccurdy/glTF-Transform/pull/1375/files
//
// The only exported functions are "mergeDocuments" and "copyToDocument",
// which will be replaced by the functions from glTF-Transform 4.0

import { Document, Extension } from "@gltf-transform/core";
import { Graph } from "@gltf-transform/core";
import { Property } from "@gltf-transform/core";
import { PropertyType } from "@gltf-transform/core";
import { PropertyResolver } from "@gltf-transform/core/dist/properties";

const { TEXTURE_INFO, ROOT } = PropertyType;
type PropertyConstructor = new (g: Graph<Property>) => Property;
const NO_TRANSFER_TYPES = new Set<string>([TEXTURE_INFO, ROOT]);

function listNonRootProperties(document: Document): Property[] {
  const visited = new Set<Property>();
  for (const edge of document.getGraph().listEdges()) {
    visited.add(edge.getChild());
  }
  return Array.from(visited);
}

export function mergeDocuments(
  target: Document,
  source: Document,
  resolve?: PropertyResolver<Property>
): Map<Property, Property> {
  resolve ||= createDefaultPropertyResolver(target, source);

  for (const sourceExtension of source.getRoot().listExtensionsUsed()) {
    const targetExtension = target.createExtension(
      sourceExtension.constructor as new (doc: Document) => Extension
    );
    if (sourceExtension.isRequired()) targetExtension.setRequired(true);
  }

  // Root properties (name, asset, default scene, extras) are not overwritten.
  return _copyToDocument(
    target,
    source,
    listNonRootProperties(source),
    resolve
  );
}

export function copyToDocument(
  target: Document,
  source: Document,
  sourceProperties: Property[],
  resolve?: PropertyResolver<Property>
): Map<Property, Property> {
  const sourcePropertyDependencies = new Set<Property>();
  for (const property of sourceProperties) {
    if (NO_TRANSFER_TYPES.has(property.propertyType)) {
      throw new Error(`Type "${property.propertyType}" cannot be transferred.`);
    }
    listPropertyDependencies(property, sourcePropertyDependencies);
  }
  return _copyToDocument(
    target,
    source,
    Array.from(sourcePropertyDependencies),
    resolve
  );
}

function _copyToDocument(
  target: Document,
  source: Document,
  sourceProperties: Property[],
  resolve?: PropertyResolver<Property>
): Map<Property, Property> {
  resolve ||= createDefaultPropertyResolver(target, source);

  // Create stub classes for every Property in other Document.
  const propertyMap = new Map<Property, Property>();
  for (const sourceProp of sourceProperties) {
    // TextureInfo copy handled by Material or ExtensionProperty.
    if (
      !propertyMap.has(sourceProp) &&
      sourceProp.propertyType !== TEXTURE_INFO
    ) {
      propertyMap.set(sourceProp, resolve(sourceProp));
    }
  }

  // Assemble relationships between Properties.
  for (const [sourceProp, targetProp] of propertyMap.entries()) {
    targetProp.copy(sourceProp, resolve);
  }

  return propertyMap;
}

function createDefaultPropertyResolver(
  target: Document,
  source: Document
): PropertyResolver<Property> {
  const propertyMap = new Map<Property, Property>([
    [source.getRoot(), target.getRoot()],
  ]);

  return (sourceProp: Property): Property => {
    // TextureInfo lifecycle is bound to a Material or ExtensionProperty.
    if (sourceProp.propertyType === TEXTURE_INFO) return sourceProp;

    let targetProp = propertyMap.get(sourceProp);
    if (!targetProp) {
      // Create stub class, defer copying properties.
      const PropertyClass = sourceProp.constructor as PropertyConstructor;
      targetProp = new PropertyClass(target.getGraph());
      propertyMap.set(sourceProp, targetProp);
    }

    return targetProp;
  };
}

function listPropertyDependencies(
  parent: Property,
  visited: Set<Property>
): Set<Property> {
  const graph = parent.getGraph();
  const queue: Property[] = [parent];

  let next: Property | undefined = undefined;
  while ((next = queue.pop())) {
    visited.add(next);
    for (const child of graph.listChildren(next)) {
      if (!visited.has(child)) {
        queue.push(child);
      }
    }
  }

  return visited;
}
