"use strict";

const fs = require("fs");
const path = require("path");
const glob = require("glob");

function defaultValue(a, b) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

/**
 * Returns the license data from the specified package, as it is
 * found in the `node_modules/<packageName>/package.json`.
 *
 * @param {string} packageName
 * @param {object} override
 * @returns The license data
 */
function getLicenseDataFromPackage(packageName, override) {
  override = defaultValue(override, {});
  const packagePath = path.join("node_modules", packageName, "package.json");

  if (!fs.existsSync(packagePath)) {
    throw new Error(`Unable to find ${packageName} license information`);
  }

  const contents = fs.readFileSync(packagePath);
  const packageJson = JSON.parse(contents);

  let licenseField = override.license;

  if (!licenseField) {
    if (packageJson.license !== undefined) {
      licenseField = [packageJson.license];
    } else if (packageJson.licenses !== undefined) {
      licenseField = packageJson.licenses;
    }
  }
  if (!licenseField) {
    console.log(`No license found for ${packageName}`);
    licenseField = ["NONE"];
  }

  let version = packageJson.version;
  if (!packageJson.version) {
    console.log(`No version information found for ${packageName}`);
    version = "NONE";
  }

  return {
    name: packageName,
    license: licenseField,
    version: version,
    url: `https://www.npmjs.com/package/${packageName}`,
    notes: override.notes,
  };
}

function readThirdPartyExtraJson(baseDirectory) {
  const extraPath = path.resolve(baseDirectory, "ThirdParty.extra.json");
  if (fs.existsSync(extraPath)) {
    const contents = fs.readFileSync(extraPath);
    return JSON.parse(contents);
  }
  return [];
}

/**
 * Collect all dependencies that are declared in the `package.json`
 * file that is found in the given directory, and add the entries
 * to the given licenseDatas array.
 *
 * @param {string} baseDirectory
 * @param {object[]} licenseDatas
 */
async function collectThirdParty(baseDirectory, licenseDatas) {
  const packageJsonPath = path.resolve(baseDirectory, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
  const thirdPartyExtraJson = readThirdPartyExtraJson(baseDirectory);
  const dependencies = packageJson.dependencies;
  for (const packageName in dependencies) {
    if (dependencies.hasOwnProperty(packageName)) {
      const existingEntry = licenseDatas.find(
        (entry) => entry.name === packageName
      );
      if (existingEntry === undefined) {
        const override = thirdPartyExtraJson.find(
          (entry) => entry.name === packageName
        );
        licenseDatas.push(getLicenseDataFromPackage(packageName, override));
      }
    }
  }
}

async function generateThirdParty() {
  // The pattern for dependency names that will be
  // excluded because they are actually internal ones.
  // In the future, this might, for example, be
  // something like "@3d-tiles-tools/.*".
  const exclusionRegex = undefined;

  console.log("Generating ThirdParty.json...");

  const rootDirectory = "./";
  const rootPackageJsonPath = path.resolve(rootDirectory, "package.json");
  const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath));

  const licenseDatas = [];
  collectThirdParty(rootDirectory, licenseDatas);

  const workspaces = rootPackageJson.workspaces;
  if (workspaces !== undefined && Array.isArray(workspaces)) {
    for (const workspacePattern of workspaces) {
      const workspaceDirectories = glob.sync(workspacePattern);
      for (const workspaceDirectory of workspaceDirectories) {
        console.log("  Collecting dependencies from " + workspaceDirectory);
        collectThirdParty(workspaceDirectory, licenseDatas);
      }
    }
  }

  licenseDatas.sort(function (a, b) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });

  let thirdPartyJson;
  if (exclusionRegex !== undefined) {
    thirdPartyJson = licenseDatas.filter((entry) => {
      const match = entry.name.match(exclusionRegex);
      return match === null;
    });
  } else {
    thirdPartyJson = licenseDatas;
  }

  fs.writeFileSync("ThirdParty.json", JSON.stringify(thirdPartyJson, null, 2));
  console.log("Generating ThirdParty.json DONE");
}

generateThirdParty();
