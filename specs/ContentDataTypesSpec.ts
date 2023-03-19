import { ContentDataTypes } from "../src/contentTypes/ContentDataTypes";
import { BufferedContentData } from "../src/contentTypes/BufferedContentData";
import { ContentDataTypeRegistry } from "../src/contentTypes/ContentDataTypeRegistry";

describe("ContentDataTypeRegistry.findContentDataType", function () {
  it("detects GLB", async function () {
    const contentUri = "specs/data/contentTypes/content.glb";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GLB);
  });

  it("detects B3DM", async function () {
    const contentUri = "specs/data/contentTypes/content.b3dm";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_B3DM);
  });

  it("detects I3DM", async function () {
    const contentUri = "specs/data/contentTypes/content.i3dm";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_I3DM);
  });

  it("detects CMPT", async function () {
    const contentUri = "specs/data/contentTypes/content.cmpt";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_CMPT);
  });

  it("detects PNTS", async function () {
    const contentUri = "specs/data/contentTypes/content.pnts";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_PNTS);
  });

  it("detects GEOM", async function () {
    const contentUri = "specs/data/contentTypes/content.geom";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GEOM);
  });

  it("detects VCTR", async function () {
    const contentUri = "specs/data/contentTypes/content.vctr";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_VCTR);
  });

  it("detects SUBT", async function () {
    const contentUri = "specs/data/contentTypes/content.subtree";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_SUBT);
  });

  it("detects PNG", async function () {
    const contentUri = "specs/data/contentTypes/content.png";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_PNG);
  });

  it("detects JPEG", async function () {
    const contentUri = "specs/data/contentTypes/content.jpg";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_JPEG);
  });

  it("detects GEOJSON", async function () {
    const contentUri = "specs/data/contentTypes/content.geojson";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GEOJSON);
  });

  it("detects 3TZ", async function () {
    const contentUri = "specs/data/contentTypes/content.3tz";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_3TZ);
  });

  it("detects glTF", async function () {
    const contentUri = "specs/data/contentTypes/content.gltf";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_GLTF);
  });

  it("detects tileset", async function () {
    const contentUri = "specs/data/contentTypes/content.json";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toEqual(ContentDataTypes.CONTENT_TYPE_TILESET);
  });

  it("returns undefined for unknown content types", async function () {
    const contentUri = "specs/data/contentTypes/content.txt";
    const c = BufferedContentData.create(contentUri);
    const type = await ContentDataTypeRegistry.findContentDataType(c);
    expect(type).toBeUndefined();
  });
});
