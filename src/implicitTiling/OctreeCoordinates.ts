import { MortonOrder } from "./MortonOrder";
import { Octrees } from "./Octrees";
import { TreeCoordinates } from "./TreeCoordinates";

/**
 * An implementation of `TreeCoordinates` for octrees
 */
export class OctreeCoordinates implements TreeCoordinates {
  private readonly _level: number;
  private readonly _x: number;
  private readonly _y: number;
  private readonly _z: number;

  constructor(level: number, x: number, y: number, z: number) {
    this._level = level;
    this._x = x;
    this._y = y;
    this._z = z;
  }

  get level(): number {
    return this._level;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get z(): number {
    return this._z;
  }

  parent(): OctreeCoordinates | null {
    if (this._level === 0) {
      return null;
    }
    const pLevel = this._level - 1;
    const px = this._x >> 1;
    const py = this._y >> 1;
    const pz = this._z >> 1;
    return new OctreeCoordinates(pLevel, px, py, pz);
  }

  *children(): IterableIterator<OctreeCoordinates> {
    const nLevel = this._level + 1;
    const nX = this._x << 1;
    const nY = this._y << 1;
    const nZ = this._z << 1;
    yield new OctreeCoordinates(nLevel, nX + 0, nY + 0, nZ + 0);
    yield new OctreeCoordinates(nLevel, nX + 1, nY + 0, nZ + 0);
    yield new OctreeCoordinates(nLevel, nX + 0, nY + 1, nZ + 0);
    yield new OctreeCoordinates(nLevel, nX + 1, nY + 1, nZ + 0);
    yield new OctreeCoordinates(nLevel, nX + 0, nY + 0, nZ + 1);
    yield new OctreeCoordinates(nLevel, nX + 1, nY + 0, nZ + 1);
    yield new OctreeCoordinates(nLevel, nX + 0, nY + 1, nZ + 1);
    yield new OctreeCoordinates(nLevel, nX + 1, nY + 1, nZ + 1);
  }

  descendants(
    maxLevelInclusive: number,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    depthFirst: boolean = false
  ): IterableIterator<OctreeCoordinates> {
    const queue: OctreeCoordinates[] = [this];
    const result = {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<OctreeCoordinates, void> {
        const element = depthFirst ? queue.pop() : queue.shift();
        if (!element) {
          return { value: undefined, done: true };
        }
        if (element.level < maxLevelInclusive) {
          for (const c of element.children()) {
            queue.push(c);
          }
        }
        return { value: element, done: false };
      },
    };
    return result;
  }

  toArray(): number[] {
    return [this.level, this.x, this.y, this.z];
  }

  toIndex(): number {
    const offset = Octrees.computeNumberOfNodesForLevels(this._level);
    return offset + this.toIndexInLevel();
  }

  toIndexInLevel(): number {
    return MortonOrder.encode3D(this._x, this._y, this._z);
  }

  toString = (): string => {
    return `(level ${this.level}, (${this._x},${this._y},${this._z}))`;
  };
}
