import {
  Cartesian3,
  Math as CesiumMath,
  Matrix3,
  Matrix4,
  OrientedBoundingBox,
  Quaternion,
} from "cesium";

import { BoundingVolumesContainment } from "../../../src/tools/tilesetProcessing/BoundingVolumesContainment";

/**
 * Converts the given values from degrees to radians, and passes them
 * to BoundingVolumesContainment.longitudeRangeContainsInclusive,
 * returning whether the actual containment matches the expected one.
 *
 * @param westDeg - The west (leftmost) point, in degrees
 * @param eastDeg - The east (rightmost) point, in degrees
 * @param pointDeg - The point, in degrees
 * @param expected - The expected containment
 * @returns Whether the actual containment matches the expected one
 */
const check = (
  westDeg: number,
  eastDeg: number,
  pointDeg: number,
  expected: boolean
) => {
  const epsilon = 1e-12;
  const westRad = CesiumMath.toRadians(westDeg);
  const eastRad = CesiumMath.toRadians(eastDeg);
  const pointRad = CesiumMath.toRadians(pointDeg);
  const actual = BoundingVolumesContainment.longitudeRangeContainsInclusive(
    westRad,
    eastRad,
    pointRad,
    epsilon
  );
  return expected == actual;
};

/**
 * Calls 'check' with the given arguments, with all combinations of
 * adding/subtracting 360 degrees, to check the wrapping behavior.
 *
 * @param westDeg - The west (leftmost) point, in degrees
 * @param eastDeg - The east (rightmost) point, in degrees
 * @param pointDeg - The point, in degrees
 * @param expected - The expected containment
 * @returns Whether the actual containment matches the expected one
 */
const checkAll = (
  westDeg: number,
  eastDeg: number,
  pointDeg: number,
  expected: boolean
) => {
  let a = true;
  a = a && check(westDeg, eastDeg, pointDeg, expected);

  a = a && check(westDeg + 360, eastDeg, pointDeg, expected);
  a = a && check(westDeg - 360, eastDeg, pointDeg, expected);
  a = a && check(westDeg, eastDeg + 360, pointDeg, expected);
  a = a && check(westDeg, eastDeg - 360, pointDeg, expected);
  a = a && check(westDeg + 360, eastDeg + 360, pointDeg, expected);
  a = a && check(westDeg - 360, eastDeg - 360, pointDeg, expected);

  a = a && check(westDeg + 360, eastDeg, pointDeg + 360, expected);
  a = a && check(westDeg - 360, eastDeg, pointDeg + 360, expected);
  a = a && check(westDeg, eastDeg + 360, pointDeg + 360, expected);
  a = a && check(westDeg, eastDeg - 360, pointDeg + 360, expected);
  a = a && check(westDeg + 360, eastDeg + 360, pointDeg + 360, expected);
  a = a && check(westDeg - 360, eastDeg - 360, pointDeg + 360, expected);

  a = a && check(westDeg + 360, eastDeg, pointDeg - 360, expected);
  a = a && check(westDeg - 360, eastDeg, pointDeg - 360, expected);
  a = a && check(westDeg, eastDeg + 360, pointDeg - 360, expected);
  a = a && check(westDeg, eastDeg - 360, pointDeg - 360, expected);
  a = a && check(westDeg + 360, eastDeg + 360, pointDeg - 360, expected);
  a = a && check(westDeg - 360, eastDeg - 360, pointDeg - 360, expected);

  return a;
};

/**
 * Transforms the given oriented bounding box with the given matrix
 *
 * @param orientedBoundingBox The oriented bounding box
 * @param transform The transform matrix
 * @returns The result
 */
const transformOrientedBoundingBox = (
  orientedBoundingBox: OrientedBoundingBox,
  transform: Matrix4
) => {
  const result = new OrientedBoundingBox();
  Matrix4.multiplyByPoint(transform, orientedBoundingBox.center, result.center);
  const rotationScaleTransform = Matrix4.getMatrix3(transform, new Matrix3());
  Matrix3.multiply(
    rotationScaleTransform,
    orientedBoundingBox.halfAxes,
    result.halfAxes
  );
  return result;
};

/**
 * Tests for the BoundingVolumesContainment class
 */
describe("BoundingVolumesContainment", function () {
  it("boxContains works", function () {
    const epsilon = 1e-12;

    // Create an arbitrary matrix to be applied to the OBB and points,
    // involving translation, rotation, and scale
    const transform = Matrix4.fromTranslationQuaternionRotationScale(
      new Cartesian3(1.0, 2.0, 3.0),
      Quaternion.fromAxisAngle(
        new Cartesian3(2.0, 4.0, 6.0),
        CesiumMath.toRadians(45)
      ),
      new Cartesian3(2.0, 4.0, 6.0)
    );

    // Create a "unit OBB", transform it, and convert the result into a "box" array
    const unitObb = new OrientedBoundingBox(Cartesian3.ZERO, Matrix3.IDENTITY);
    const obb = transformOrientedBoundingBox(unitObb, transform);
    const box = OrientedBoundingBox.pack(obb, Array<number>(12), 0);

    // Transform cartesians that are relative to the unit OBB
    // with the matrix, convert them into point[] arrays,
    // and perform the containment checks

    const cartesianIn = new Cartesian3(0.9, 0.9, 0.9);
    Matrix4.multiplyByPoint(transform, cartesianIn, cartesianIn);
    const pointIn = Array<number>(3);
    Cartesian3.pack(cartesianIn, pointIn, 0);
    const actualIn = BoundingVolumesContainment.boxContains(
      box,
      pointIn,
      epsilon
    );
    const expectedIn = true;
    expect(actualIn).toBe(expectedIn);

    const cartesianOn = new Cartesian3(1.0, 1.0, 1.0);
    Matrix4.multiplyByPoint(transform, cartesianOn, cartesianOn);
    const pointOn = Array<number>(3);
    Cartesian3.pack(cartesianOn, pointOn, 0);
    const actualOn = BoundingVolumesContainment.boxContains(
      box,
      pointOn,
      epsilon
    );
    const expectedOn = true;
    expect(actualOn).toBe(expectedOn);

    const cartesianOut = new Cartesian3(1.0, 1.0, 1.01);
    Matrix4.multiplyByPoint(transform, cartesianOut, cartesianOut);
    const pointOut = Array<number>(3);
    Cartesian3.pack(cartesianOut, pointOut, 0);
    const actualOut = BoundingVolumesContainment.boxContains(
      box,
      pointOut,
      epsilon
    );
    const expectedOut = false;
    expect(actualOut).toBe(expectedOut);
  });

  it("sphereContains works", function () {
    const epsilon = 1e-12;
    const sphere = [1.0, 2.0, 3.0, 10.0];

    const pointIn = [1.0 + 9.99, 2.0, 3.0];
    const actualIn = BoundingVolumesContainment.sphereContains(
      sphere,
      pointIn,
      epsilon
    );
    const expectedIn = true;
    expect(actualIn).toBe(expectedIn);

    const pointOn = [1.0, 2.0 + 10.0, 3.0];
    const actualOn = BoundingVolumesContainment.sphereContains(
      sphere,
      pointOn,
      epsilon
    );
    const expectedOn = true;
    expect(actualOn).toBe(expectedOn);

    const pointOut = [1.0, 2.0, 3.0 + 10.01];
    const actualOut = BoundingVolumesContainment.sphereContains(
      sphere,
      pointOut,
      epsilon
    );
    const expectedOut = false;
    expect(actualOut).toBe(expectedOut);
  });

  it("regionContains works", function () {
    const epsilon = 1e-6;

    const westRad = CesiumMath.toRadians(20);
    const southRad = CesiumMath.toRadians(10);
    const eastRad = CesiumMath.toRadians(30);
    const northRad = CesiumMath.toRadians(40);
    const minHeightMeters = 50;
    const maxHeightMeters = 60;
    const region = [
      westRad,
      southRad,
      eastRad,
      northRad,
      minHeightMeters,
      maxHeightMeters,
    ];

    const cartesianIn = Cartesian3.fromDegrees(25, 20, 55);
    const pointIn = Array<number>(3);
    Cartesian3.pack(cartesianIn, pointIn, 0);
    const actualIn = BoundingVolumesContainment.regionContains(
      region,
      pointIn,
      epsilon
    );
    const expectedIn = true;
    expect(actualIn).toBe(expectedIn);

    const cartesianOn = Cartesian3.fromDegrees(20, 30, 50);
    const pointOn = Array<number>(3);
    Cartesian3.pack(cartesianOn, pointOn, 0);
    const actualOn = BoundingVolumesContainment.regionContains(
      region,
      pointOn,
      epsilon
    );
    const expectedOn = true;
    expect(actualOn).toBe(expectedOn);

    const cartesianOut = Cartesian3.fromDegrees(19, 20, 55);
    const pointOut = Array<number>(3);
    Cartesian3.pack(cartesianOut, pointOut, 0);
    const actualOut = BoundingVolumesContainment.regionContains(
      region,
      pointOut,
      epsilon
    );
    const expectedOut = false;
    expect(actualOut).toBe(expectedOut);
  });

  it("longitudeRangeContainsInclusive works", function () {
    // Both positive, left, in, right
    expect(checkAll(20, 40, 10, false)).toBeTrue();
    expect(checkAll(20, 40, 20, true)).toBeTrue();
    expect(checkAll(20, 40, 30, true)).toBeTrue();
    expect(checkAll(20, 40, 40, true)).toBeTrue();
    expect(checkAll(20, 40, 50, false)).toBeTrue();

    // Both negative, left, in, right
    expect(checkAll(-40, -20, -50, false)).toBeTrue();
    expect(checkAll(-40, -20, -40, true)).toBeTrue();
    expect(checkAll(-40, -20, -30, true)).toBeTrue();
    expect(checkAll(-40, -20, -20, true)).toBeTrue();
    expect(checkAll(-40, -20, -10, false)).toBeTrue();

    // Crossing meridian, left, negative in, positive in, right
    expect(checkAll(-20, 20, -30, false)).toBeTrue();
    expect(checkAll(-20, 20, -20, true)).toBeTrue();
    expect(checkAll(-20, 20, -10, true)).toBeTrue();
    expect(checkAll(-20, 20, 10, true)).toBeTrue();
    expect(checkAll(-20, 20, 20, true)).toBeTrue();
    expect(checkAll(-20, 20, 30, false)).toBeTrue();

    // Crossing antimeridian, left, positive in, negative in, right
    expect(checkAll(160, -160, 150, false)).toBeTrue();
    expect(checkAll(160, -160, 160, true)).toBeTrue();
    expect(checkAll(160, -160, 170, true)).toBeTrue();
    expect(checkAll(160, -160, -160, true)).toBeTrue();
    expect(checkAll(160, -160, -150, false)).toBeTrue();

    // Special cases
    expect(checkAll(180, -180, 180, true)).toBeTrue();
    expect(checkAll(180, -180, -180, true)).toBeTrue();
    expect(checkAll(0, 0, 0, true)).toBeTrue();
    expect(checkAll(0, 0, 360, true)).toBeTrue();
    expect(checkAll(0, 360, 0, true)).toBeTrue();
    expect(checkAll(0, 360, 360, true)).toBeTrue();
  });
});
