import { TilesetTarget } from "../src/tilesetData/TilesetTarget";
import { TilesetTargetFs } from "../src/tilesetData/TilesetTargetFs";

describe("TilesetTarget", function () {
  let tilesetTarget: TilesetTarget;
  let targetName: string;

  // TODO This should be done for each implementation
  // of the TilesetTarget interface
  beforeEach(function () {
    tilesetTarget = new TilesetTargetFs();
    targetName = "./output/tilesetTargetSpec";
  });

  it("throws when trying to access it before calling 'begin'", function () {
    expect(function () {
      tilesetTarget.addEntry("KEY_FOR_SPEC", Buffer.alloc(1));
    }).toThrowError();
  });

  it("throws when trying to call 'end' before calling 'begin'", async function () {
    await expectAsync(
      (async function () {
        return await tilesetTarget.end();
      })()
    ).toBeRejectedWithError();
    // ^ This () is important to really CALL the anonymous function
    // and return a promise.
  });

  it("throws when trying to call 'begin' twice", function () {
    tilesetTarget.begin(targetName, true);
    expect(function () {
      tilesetTarget.begin(targetName, true);
    }).toThrowError();
  });

  it("allows access after calling 'begin' and before calling 'end'", function () {
    tilesetTarget.begin(targetName, true);
    tilesetTarget.addEntry("KEY_FOR_SPEC", Buffer.alloc(1));
  });

  it("throws when trying to access it after calling 'end'", async function () {
    tilesetTarget.begin(targetName, true);
    await tilesetTarget.end();
    expect(function () {
      tilesetTarget.addEntry("KEY_FOR_SPEC", Buffer.alloc(1));
    }).toThrowError();
  });

  it("throws when trying to call 'end' twice", async function () {
    tilesetTarget.begin(targetName, true);
    await tilesetTarget.end();
    await expectAsync(
      (async function () {
        return await tilesetTarget.end();
      })()
    ).toBeRejectedWithError();
    // ^ This () is important to really CALL the anonymous function
    // and return a promise.
  });
});
