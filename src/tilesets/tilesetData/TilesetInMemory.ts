import { TilesetSource } from "./TilesetSource";
import { TilesetError } from "./TilesetError";
import { TilesetTarget } from "./TilesetTarget";
import { Iterables } from "../../base";

/**
 * Implementation of a TilesetSource and TilesetTarget that
 * stores the data in memory.
 *
 * This is mainly intended for tests and debugging.
 *
 * @internal
 */
export class TilesetInMemory implements TilesetSource, TilesetTarget {
  /**
   * The mapping from keys to the actual data
   */
  private readonly dataMap: { [key: string]: Buffer } = {};

  /**
   * Whether this source has already been opened
   */
  private sourceIsOpen: boolean;

  /**
   * Whether this target has already been opened
   */
  private targetIsOpen: boolean;

  /**
   * The overwrite flag for the target
   */
  private overwrite: boolean;

  /**
   * Default constructor
   */
  constructor() {
    this.sourceIsOpen = false;
    this.targetIsOpen = false;
    this.overwrite = false;
  }

  /** {@inheritDoc TilesetSource.open} */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async open(fullInputName: string) {
    if (this.sourceIsOpen) {
      throw new TilesetError("Source already opened");
    }
    this.sourceIsOpen = true;
  }

  /** {@inheritDoc TilesetSource.getKeys} */
  async getKeys() {
    if (!this.sourceIsOpen) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    return Iterables.makeAsync(Object.keys(this.dataMap));
  }

  /** {@inheritDoc TilesetSource.getValue} */
  async getValue(key: string): Promise<Buffer | undefined> {
    if (!this.sourceIsOpen) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    return this.dataMap[key];
  }

  /** {@inheritDoc TilesetSource.close} */
  async close() {
    if (!this.sourceIsOpen) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    this.sourceIsOpen = false;
  }

  /** {@inheritDoc TilesetTarget.begin} */
  async begin(fullOutputName: string, overwrite: boolean) {
    if (this.targetIsOpen) {
      throw new TilesetError("Target already opened");
    }
    this.targetIsOpen = true;
    this.overwrite = overwrite;
  }

  /** {@inheritDoc TilesetTarget.addEntry} */
  async addEntry(key: string, content: Buffer) {
    if (!this.targetIsOpen) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    if (this.dataMap[key]) {
      if (!this.overwrite) {
        throw new TilesetError("Entry already exists: " + key);
      }
    }
    this.dataMap[key] = content;
  }

  /** {@inheritDoc TilesetTarget.end} */
  async end() {
    if (!this.targetIsOpen) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    this.targetIsOpen = false;
    this.overwrite = false;
  }
}
