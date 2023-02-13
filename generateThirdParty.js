"use strict";

const fs = require("fs");
const path = require("path");

function defaultValue(a, b) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}
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
    licenseField = [packageJson.license];
  }

  if (!licenseField && packageJson.licenses) {
    licenseField = packageJson.licenses;
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

function readThirdPartyExtraJson() {
  const path = "ThirdParty.extra.json";
  if (fs.existsSync(path)) {
    const contents = fs.readFileSync(path);
    return JSON.parse(contents);
  }
  return [];
}

async function generateThirdParty() {
  const packageJson = JSON.parse(fs.readFileSync("package.json"));
  const thirdPartyExtraJson = readThirdPartyExtraJson();

  const thirdPartyJson = [];

  const dependencies = packageJson.dependencies;
  for (const packageName in dependencies) {
    if (dependencies.hasOwnProperty(packageName)) {
      const override = thirdPartyExtraJson.find(
        (entry) => entry.name === packageName
      );
      thirdPartyJson.push(getLicenseDataFromPackage(packageName, override));
    }
  }

  thirdPartyJson.sort(function (a, b) {
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

  fs.writeFileSync("ThirdParty.json", JSON.stringify(thirdPartyJson, null, 2));
}

generateThirdParty();
