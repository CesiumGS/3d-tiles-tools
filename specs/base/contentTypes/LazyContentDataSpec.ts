/* eslint-disable @typescript-eslint/no-unused-vars */

import { LazyContentData } from "../../../src/base";
import { ResourceResolver } from "../../../src/base";

function createTestResourceResolver(): ResourceResolver {
  return {
    async resolveData(uri: string): Promise<Buffer | null> {
      return null;
    },
    async resolveDataPartial(
      uri: string,
      maxBytes: number
    ): Promise<Buffer | null> {
      return null;
    },
    derive(uri: string): ResourceResolver {
      return this;
    },
  };
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
