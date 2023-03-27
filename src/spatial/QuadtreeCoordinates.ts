import { MortonOrder } from "./MortonOrder";
import { Quadtrees } from "./Quadtrees";
import { TreeCoordinates } from "./TreeCoordinates";

/**
 * An implementation of `TreeCoordinates` for octrees
 *
 * @internal
 */
export class QuadtreeCoordinates implements TreeCoordinates {
  private readonly _level: number;
  private readonly _x: number;
  private readonly _y: number;

  constructor(level: number, x: number, y: number) {
    this._level = level;
    this._x = x;
    this._y = y;
  }

  /** {@inheritDoc TreeCoordinates.level} */
  get level(): number {
    return this._level;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  /** {@inheritDoc TreeCoordinates.parent} */
  parent(): QuadtreeCoordinates | null {
    if (this._level === 0) {
      return null;
    }
    const pLevel = this._level - 1;
    const px = this._x >> 1;
    const py = this._y >> 1;
    return new QuadtreeCoordinates(pLevel, px, py);
  }

  /** {@inheritDoc TreeCoordinates.children} */
  *children(): IterableIterator<QuadtreeCoordinates> {
    const nLevel = this._level + 1;
    const nX = this._x << 1;
    const nY = this._y << 1;
    yield new QuadtreeCoordinates(nLevel, nX + 0, nY + 0);
    yield new QuadtreeCoordinates(nLevel, nX + 1, nY + 0);
    yield new QuadtreeCoordinates(nLevel, nX + 0, nY + 1);
    yield new QuadtreeCoordinates(nLevel, nX + 1, nY + 1);
  }

  /** {@inheritDoc TreeCoordinates.descendants} */
  descendants(
    maxLevelInclusive: number,
    depthFirst: boolean
  ): IterableIterator<QuadtreeCoordinates> {
    const queue: QuadtreeCoordinates[] = [this];
    const result = {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<QuadtreeCoordinates, void> {
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

  /** {@inheritDoc TreeCoordinates.toArray} */
  toArray(): number[] {
    return [this.level, this.x, this.y];
  }

  /** {@inheritDoc TreeCoordinates.toIndex} */
  toIndex(): number {
    const offset = Quadtrees.computeNumberOfNodesForLevels(this._level);
    return offset + this.toIndexInLevel();
  }

  /** {@inheritDoc TreeCoordinates.toIndexInLevel} */
  toIndexInLevel(): number {
    return MortonOrder.encode2D(this._x, this._y);
  }

  toString = (): string => {
    return `(level ${this.level}, (${this._x},${this._y}))`;
  };
}
