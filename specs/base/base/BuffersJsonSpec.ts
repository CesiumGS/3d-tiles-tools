import { Buffers } from "../../../src/base";

describe("Buffer::isProbablyJson", function () {
  it("detects JSON object", function () {
    const buffer = Buffer.from('{ "foo:" : "bar" }', "utf-8");
    const result = Buffers.isProbablyJson(buffer);
    expect(result).toBeTrue();
  });
  it("detects JSON array", function () {
    const buffer = Buffer.from('[ { "foo:" : "bar" } ]', "utf-8");
    const result = Buffers.isProbablyJson(buffer);
    expect(result).toBeTrue();
  });
  it("detects JSON object with leading whitespace", function () {
    const buffer = Buffer.from('  \t   { "foo:" : "bar" }', "utf-8");
    const result = Buffers.isProbablyJson(buffer);
    expect(result).toBeTrue();
  });
  it("detects JSON array with leading whitespace", function () {
    const buffer = Buffer.from('  \t  [ { "foo:" : "bar" } ]', "utf-8");
    const result = Buffers.isProbablyJson(buffer);
    expect(result).toBeTrue();
  });
  it("detects non-JSON from string", function () {
    const buffer = Buffer.from("  \t not JSON", "utf-8");
    const result = Buffers.isProbablyJson(buffer);
    expect(result).toBeFalse();
  });
  it("detects non-JSON from binary data", function () {
    const buffer = Buffer.alloc(4);
    buffer[0] = 20;
    buffer[1] = 32;
    buffer[2] = 12;
    buffer[3] = 23;
    const result = Buffers.isProbablyJson(buffer);
    expect(result).toBeFalse();
  });
});
