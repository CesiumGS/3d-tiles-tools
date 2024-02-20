import fs from "fs";

import { TilesetSources } from "3d-tiles-tools";
import { TilesetTargets } from "3d-tiles-tools";

/**
 * Basic example showing how to create a package
 *
 * @param {String} fileName The package file name
 */
async function createPackageExample(fileName: string) {
  console.log("Creating package " + fileName);

  const overwrite = true;
  const tilesetTarget = TilesetTargets.createAndBegin(fileName, overwrite);

  tilesetTarget.addEntry("example.json", Buffer.alloc(100));
  tilesetTarget.addEntry("example.glb", Buffer.alloc(1000));

  await tilesetTarget.end();

  console.log("Creating package DONE");
}

/**
 * Basic example showing how to read a package
 *
 * @param {String} fileName The package file name
 */
async function readPackageExample(fileName: string) {
  console.log("Reading package " + fileName);

  const tilesetSource = TilesetSources.createAndOpen(fileName);

  console.log("Package contents:");
  for (const key of tilesetSource.getKeys()) {
    console.log("  key: " + key);
  }

  const valueA = tilesetSource.getValue("example.json");
  console.log("Value for example.json ", valueA);

  const valueB = tilesetSource.getValue("example.glb");
  console.log("Value for example.glb  ", valueB);

  tilesetSource.close();

  console.log("Reading package DONE");
}

async function run() {
  console.log("Running test");

  const directory = "./output/";
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const fileName = directory + "example";

  await createPackageExample(fileName + ".3dtiles");
  await readPackageExample(fileName + ".3dtiles");

  await createPackageExample(fileName + ".3tz");
  await readPackageExample(fileName + ".3tz");

  console.log("Running test DONE");
}

run();
