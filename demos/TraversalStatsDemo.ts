import fs from "fs";
import path from "path";

import { readJsonUnchecked } from "./readJsonUnchecked";

import { ResourceResolvers } from "../src/io/ResourceResolvers";

import { TilesetTraverser } from "../src/traversal/TilesetTraverser";
import { TraversedTile } from "../src/traversal/TraversedTile";
import { BufferedContentData } from "../src/contentTypes/BufferedContentData";
import { ContentDataTypeRegistry } from "../src/contentTypes/ContentDataTypeRegistry";
import { ContentDataTypeChecks } from "../src/contentTypes/ContentDataTypeChecks";
import { ContentDataTypes } from "../src/contentTypes/ContentDataTypes";

// A small demo that traverses a tileset, passes all
// traversed tiles to a "StatsCollector" (defined below),
// and creates a short JSON summary of some statistics.

async function tilesetTraversalDemo(filePath: string) {
  const statsCollector = new StatsCollector();

  // Create a check that determines whether content
  // data should count as "tile content"
  const isTileFileContent = ContentDataTypeChecks.createIncludedCheck(
    ContentDataTypes.CONTENT_TYPE_GLB,
    ContentDataTypes.CONTENT_TYPE_B3DM,
    ContentDataTypes.CONTENT_TYPE_I3DM,
    ContentDataTypes.CONTENT_TYPE_CMPT,
    ContentDataTypes.CONTENT_TYPE_PNTS,
    ContentDataTypes.CONTENT_TYPE_GEOM,
    ContentDataTypes.CONTENT_TYPE_VCTR,
    ContentDataTypes.CONTENT_TYPE_GEOJSON,
    ContentDataTypes.CONTENT_TYPE_GLTF
  );

  // A `TraversalCallback` that will be passed to the
  // tileset traverser, and store information about the
  // traversed tiles in the `StatsCollector`
  const statsTraversalCallback = async (traversedTile: TraversedTile) => {
    statsCollector.increment("totalNumberOfTiles");
    const subtreeUri = traversedTile.getSubtreeUri();
    if (subtreeUri !== undefined) {
      statsCollector.increment("totalNumberOfSubtres");
    }
    if (!traversedTile.isImplicitTilesetRoot()) {
      // Obtain all content URIs, resolve the associated data,
      // and store the size in the "tileFileSize"  summary if
      // the data is one of the known tile content types
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      const tileResourceResolver = traversedTile.getResourceResolver();
      for (const contentUri of contentUris) {
        const data = await tileResourceResolver.resolveData(contentUri);
        const contentData = new BufferedContentData(contentUri, data);
        const isTileFile = await isTileFileContent(contentData);
        if (isTileFile) {
          if (data) {
            statsCollector.acceptEntry("tileFileSize", data.length);
          } else {
            statsCollector.increment("unresolvableContents");
          }
        }
      }
    }

    // Store the geometric error in the "geometricError" summary
    const finalTile = traversedTile.asFinalTile();
    const geometricError = finalTile.geometricError;
    statsCollector.acceptEntry("geometricError", geometricError);
    return true;
  };

  // Read the tileset from the input path
  const directory = path.dirname(filePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const tileset = await readJsonUnchecked(filePath);

  // Create the TilesetTraverser and traverse the tileset,
  // passing each tile to the callback that stores the
  // information in the StatsCollector
  console.log("Traversing tileset");
  const tilesetTraverser = new TilesetTraverser(directory, resourceResolver, {
    depthFirst: false,
    traverseExternalTilesets: true,
  });
  await tilesetTraverser.traverse(tileset, statsTraversalCallback);
  console.log("Traversing tileset DONE");

  // Print the statistics summary to the console
  console.log("Stats:");
  const json = statsCollector.createJson();
  const jsonString = JSON.stringify(json, null, 2);
  console.log(jsonString);
}

// A simple class to collect statistical information
class StatsCollector {
  // A mapping from value names to counters
  private readonly counters: {
    [key: string]: Counter;
  } = {};

  // A mapping from value names to statistical summaries
  private readonly summaries: {
    [key: string]: Summary;
  } = {};

  // Add one entry to a summary, creating it when necessary
  acceptEntry(name: string, value: number) {
    let summary = this.summaries[name];
    if (!summary) {
      summary = new Summary();
      this.summaries[name] = summary;
    }
    summary.accept(value);
  }

  // Increment a counter, creating it when necessary
  increment(name: string) {
    let counter = this.counters[name];
    if (!counter) {
      counter = new Counter();
      this.counters[name] = counter;
    }
    counter.increment();
  }

  // Create a short JSON representation of the collected data
  createJson(): any {
    const json: any = {};
    for (const key of Object.keys(this.counters)) {
      const counter = this.counters[key];
      json[key] = counter.getCount();
    }
    for (const key of Object.keys(this.summaries)) {
      const summary = this.summaries[key];
      json[key] = {
        count: summary.getCount(),
        sum: summary.getSum(),
        min: summary.getMinimum(),
        max: summary.getMaximum(),
        avg: summary.getMean(),
        stdDev: summary.getStandardDeviation(),
      };
    }
    return json;
  }
}

/**
 * A class that serves as a counter in the `StatsCollector`
 */
class Counter {
  private count: number;

  public constructor() {
    this.count = 0;
  }

  increment() {
    this.count++;
  }

  getCount() {
    return this.count;
  }
}

/**
 * A class that can accept numbers, and collects statistical
 * information for these numbers.
 */
class Summary {
  private count: number;
  private sum: number;
  private min: number;
  private max: number;
  private varianceTracker: number;

  public constructor() {
    this.count = 0;
    this.sum = 0.0;
    this.min = Number.POSITIVE_INFINITY;
    this.max = Number.NEGATIVE_INFINITY;
    this.varianceTracker = 0.0;
  }

  accept(value: number) {
    const deviation = value - this.getMean();
    this.sum += value;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    this.count++;
    if (this.count > 1) {
      this.varianceTracker +=
        (deviation * deviation * (this.count - 1)) / this.count;
    }
  }

  getCount() {
    return this.count;
  }

  getSum() {
    return this.sum;
  }

  getMinimum() {
    return this.min;
  }

  getMaximum() {
    return this.max;
  }

  getMean() {
    return this.sum / this.count;
  }

  getStandardDeviation() {
    return Math.sqrt(this.varianceTracker / this.count);
  }
}

async function runDemo() {
  const tilesetFileName =
    "../3d-tiles-samples/1.1/SparseImplicitQuadtree/tileset.json";
  await tilesetTraversalDemo(tilesetFileName);
}

runDemo();
