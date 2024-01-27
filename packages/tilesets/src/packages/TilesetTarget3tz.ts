import fs from "fs";
import path from "path";
import archiver from "archiver";

import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetError } from "../tilesetData/TilesetError";

import { IndexBuilder } from "./IndexBuilder";

/**
 * Implementation of a TilesetTarget that creates a 3TZ file.
 *
 * @internal
 */
export class TilesetTarget3tz implements TilesetTarget {
  /**
   * The stream that the data is written to
   */
  private outputStream: fs.WriteStream | undefined;

  /**
   * The promise that fulfills when the output stream is
   * closed, or is rejected when the output stream or
   * archive emitted an error.
   */
  private finishedPromise: Promise<void> | undefined;

  /**
   * The archive object
   */
  private archive: archiver.Archiver | undefined;

  /**
   * The index builder that will be used to generate
   * the `"@3dtilesIndex1@"` file for the 3TZ file.
   */
  private readonly indexBuilder;

  /**
   * Default constructor
   */
  constructor() {
    this.outputStream = undefined;
    this.archive = undefined;
    this.indexBuilder = new IndexBuilder();
  }

  /** {@inheritDoc TilesetTarget.begin} */
  begin(fullOutputName: string, overwrite: boolean) {
    if (fs.existsSync(fullOutputName)) {
      if (overwrite) {
        fs.unlinkSync(fullOutputName);
      } else {
        throw new TilesetError("File already exists: " + fullOutputName);
      }
    } else {
      const directory = path.dirname(fullOutputName);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    }

    if (this.archive) {
      throw new TilesetError("Target already opened");
    }

    this.outputStream = fs.createWriteStream(fullOutputName);
    this.archive = archiver("zip", {
      store: true,
    });
    this.archive.pipe(this.outputStream);

    this.finishedPromise = TilesetTarget3tz.createFinishedPromise(
      this.archive,
      this.outputStream
    );

    // Logging and error handling for archiver:
    this.archive.on("warning", (error) => {
      throw new TilesetError(`${error}`);
    });
    this.archive.on("error", (error) => {
      throw new TilesetError(`${error}`);
    });
  }

  /**
   * Creates a promise that is fulfilled when the data has fully been
   * written to the target. Or maybe not. In any case, one has to wait
   * for the promise that is returned from "archiver.finalize()" AND for
   * this promise, to make sure that everything is written. For details,
   * see https://github.com/archiverjs/node-archiver/issues/476 ...
   *
   * @param archive - The archiver archive
   * @param outputStream - The output stream that the archive is writing to
   * @returns The promise that has to be waited for in "end"
   */
  private static createFinishedPromise(
    archive: archiver.Archiver,
    outputStream: fs.WriteStream
  ): Promise<void> {
    const finishedPromise = new Promise<void>((resolve, reject) => {
      archive.on("error", reject);
      outputStream.on("error", reject);
      outputStream.on("close", resolve);
    });
    return finishedPromise;
  }

  /** {@inheritDoc TilesetTarget.addEntry} */
  addEntry(key: string, content: Buffer) {
    if (!this.archive) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    this.archive.append(content, { name: key });
    this.indexBuilder.addEntry(key, content.length);
  }

  /** {@inheritDoc TilesetTarget.end} */
  async end() {
    if (!this.archive) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }

    // Create the index data, and add it as the LAST entry of the ZIP
    const indexData = this.indexBuilder.createBuffer();
    this.archive.append(indexData, { name: "@3dtilesIndex1@" });
    await this.archive.finalize();

    await this.finishedPromise;
    this.finishedPromise = undefined;
    this.outputStream = undefined;
    this.archive = undefined;
  }
}
