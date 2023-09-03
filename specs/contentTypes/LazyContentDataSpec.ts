/* eslint-disable @typescript-eslint/no-unused-vars */

import { LazyContentData } from "../../src/contentTypes/LazyContentData";
import { ResourceResolver } from "../../src/io/ResourceResolver";

import { TilesetSourceResourceResolver } from "../../src/io/TilesetSourceResourceResolver";
import { TilesetInMemory } from "../../src/tilesetData/TilesetInMemory";

function createTestResourceResolver(): ResourceResolver {
  const tilesetSource = new TilesetInMemory();
  tilesetSource.open("");
  const resourceResolver = new TilesetSourceResourceResolver(
    ".",
    tilesetSource
  );
  return resourceResolver;
}

describe("LazyContentData", function () {
  it("does not read data at construction", async function () {
    const resourceResolver = createTestResourceResolver();
    const resolveDataSpy = spyOn(
      resourceResolver,
      "resolveData"
    ).and.callThrough();
    const resolveDataPartialSpy = spyOn(
      resourceResolver,
      "resolveDataPartial"
    ).and.callThrough();

    const contentData = new LazyContentData("example.glb", resourceResolver);
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(0);

    await contentData.exists();
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledWith(
      "example.glb",
      jasmine.any(Number)
    );

    const magic = contentData.getMagic();
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(2);
    expect(resolveDataPartialSpy).toHaveBeenCalledWith("example.glb", 4);

    const data = contentData.getData();
    expect(resolveDataSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(2);
  });

  it("reads only a few bytes for getMagic", function () {
    const resourceResolver = createTestResourceResolver();
    const resolveDataSpy = spyOn(
      resourceResolver,
      "resolveData"
    ).and.callThrough();
    const resolveDataPartialSpy = spyOn(
      resourceResolver,
      "resolveDataPartial"
    ).and.callThrough();

    const contentData = new LazyContentData("example.glb", resourceResolver);
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(0);

    const magic = contentData.getMagic();
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledWith("example.glb", 4);
  });

  it("reads the data only once", async function () {
    const resourceResolver = createTestResourceResolver();
    const resolveDataSpy = spyOn(
      resourceResolver,
      "resolveData"
    ).and.callThrough();
    const resolveDataPartialSpy = spyOn(
      resourceResolver,
      "resolveDataPartial"
    ).and.callThrough();

    const contentData = new LazyContentData("example.glb", resourceResolver);
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(0);

    const data0 = await contentData.getData();
    const object0 = await contentData.getParsedObject();
    const data1 = await contentData.getData();
    const object1 = await contentData.getParsedObject();

    expect(resolveDataSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(0);
  });
});
