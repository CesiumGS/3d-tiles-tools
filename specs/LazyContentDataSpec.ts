import { DeveloperError } from "../src/base/DeveloperError";
import { LazyContentData } from "../src/contentTypes/LazyContentData";
import { ResourceResolver } from "../src/io/ResourceResolver";

class SpecResourceResolver implements ResourceResolver {
  private readonly dataMap: { [key: string]: Buffer } = {};

  putData(uri: string, buffer: Buffer) {
    this.dataMap[uri] = buffer;
  }

  async resolveData(uri: string): Promise<Buffer | null> {
    const data = this.dataMap[uri] as Buffer;
    if (!data) {
      return null;
    }
    return data;
  }
  async resolveDataPartial(
    uri: string,
    maxBytes: number
  ): Promise<Buffer | null> {
    const data = this.dataMap[uri] as Buffer;
    if (!data) {
      return null;
    }
    return data.subarray(0, maxBytes);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  derive(uri: string): ResourceResolver {
    throw new DeveloperError("Not supposed to be called.");
  }
}

describe("LazyContentData", function () {
  it("does not read data at construction", function () {
    const resourceResolver = new SpecResourceResolver();
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

    contentData.exists();
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledWith(
      "example.glb",
      jasmine.any(Number)
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const magic = contentData.getMagic();
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(2);
    expect(resolveDataPartialSpy).toHaveBeenCalledWith("example.glb", 4);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = contentData.getData();
    expect(resolveDataSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(2);
  });

  it("reads only a few bytes for getMagic", function () {
    const resourceResolver = new SpecResourceResolver();
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const magic = contentData.getMagic();
    expect(resolveDataSpy).toHaveBeenCalledTimes(0);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledWith("example.glb", 4);
  });

  it("reads the data only once", async function () {
    const resourceResolver = new SpecResourceResolver();
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data0 = await contentData.getData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const object0 = await contentData.getParsedObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data1 = await contentData.getData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const object1 = await contentData.getParsedObject();

    expect(resolveDataSpy).toHaveBeenCalledTimes(1);
    expect(resolveDataPartialSpy).toHaveBeenCalledTimes(0);
  });
});
