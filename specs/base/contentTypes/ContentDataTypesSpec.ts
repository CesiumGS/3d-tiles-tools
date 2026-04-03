import { ContentDataTypes } from "../../../src/base";
import { BufferedContentData } from "../../../src/base";
import { ContentDataTypeRegistry } from "../../../src/base";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

describe("ContentDataTypeRegistry.findContentDataType", function () {
  it("detects GLB", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.glb";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GLB);
  });

  it("detects B3DM", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.b3dm";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_B3DM);
  });

  it("detects I3DM", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.i3dm";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_I3DM);
  });

  it("detects CMPT", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.cmpt";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_CMPT);
  });

  it("detects PNTS", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.pnts";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_PNTS);
  });

  it("detects GEOM", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.geom";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GEOM);
  });

  it("detects VCTR", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.vctr";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_VCTR);
  });

  it("detects SUBT", async function () {
    const contentUri =
      SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.subtree";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_SUBT);
  });

  it("detects PNG", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.png";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_PNG);
  });

  it("detects JPEG", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.jpg";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_JPEG);
  });

  it("detects GIF", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.gif";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GIF);
  });

  it("detects GEOJSON", async function () {
    const contentUri =
      SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.geojson";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GEOJSON);
  });

  it("detects 3TZ", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.3tz";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_3TZ);
  });

  it("detects glTF", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.gltf";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GLTF);
  });

  it("detects tileset", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.json";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_TILESET);
  });

  it("returns undefined for unknown content types", async function () {
    const contentUri = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.txt";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toBeUndefined();
  });
});
