import { defined } from "./defined";

/**
 * Methods related to buffers.
 *
 * The methods in this class are convenience methods that
 * are mainly used for handling buffers that contain tile
 * data.
 */
export class Buffers {
  /**
   * Obtains the magic header from the given buffer.
   *
   * This returns up to 4 bytes of the given buffer, starting at
   * the given byte offset, converted to a string. If the buffer
   * length is too small, then a shorter string may be returned.
   *
   * @param buffer - The buffer
   * @param byteOffset - The optional byte offset, defaulting to 0
   * @return The magic header.
   */
  static getMagic(buffer: Buffer, byteOffset?: number): string {
    const magicLength = 4;
    const start = Math.min(buffer.length, byteOffset ?? 0);
    const end = Math.min(buffer.length, start + magicLength);
    return buffer.toString("utf8", start, end);
  }

  /**
   * Returns whether the first bytes of the given buffer indicate
   * that it contains data that was compressed with GZIP
   *
   * @param buffer - The buffer
   * @returns Whether the buffer contains GZIPed data
   */
  static isGzipped(buffer: Buffer): boolean {
    if (buffer.length < 2) {
      return false;
    }
    return buffer[0] === 0x1f && buffer[1] === 0x8b;
  }

  /**
   * Returns whether the data in the given buffer is probably JSON.
   *
   * This does a best-effort approach of detecting whether the data
   * is very likely to be JSON data. The details are unspecified,
   * but it may, for example, check whether the first non-whitespace
   * character in the buffer is a `[` or `{`.
   *
   * @param buffer - The buffer
   * @returns Whether the buffer data is probably JSON data
   */
  static isProbablyJson(buffer: Buffer): boolean {
    for (let i = 0; i < buffer.length; i++) {
      const c = String.fromCharCode(buffer[i]);
      // NOTE: This regex HAS to be declared here, otherwise the `test`
      // call will randomly return wrong values.
      // For details, refer to https://stackoverflow.com/q/3891641
      // They gotta be kidding. Un. Be. Lie. Va. Ble.
      const whitespaceRegex = /\s/g;
      if (whitespaceRegex.test(c)) {
        continue;
      }
      if (c === "{" || c === "[") {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  /**
   * Parses JSON data from the given buffer.
   *
   * @param buffer - The buffer
   * @return The parsed object
   */
  static getJson(buffer: Buffer): any {
    if (buffer.length === 0) {
      return {};
    }
    return JSON.parse(buffer.toString("utf8"));
  }

  /**
   * Creates a buffer that contains the JSON representation
   * of the given object, padding the end of the data with
   * spaced if necessary to make sure that the data ends
   * at an 8-byte boundary.
   *
   * @param json - The object
   * @param byteOffset - An optional offset where the buffer
   * is assumed to start, defaulting to 0
   * @return The buffer
   */
  static getJsonBufferPadded(json: any, byteOffset?: number): Buffer {
    if (!defined(json) || Object.keys(json).length === 0) {
      return Buffer.alloc(0);
    }
    byteOffset = byteOffset ?? 0;
    const string = JSON.stringify(json);
    const buffer = Buffer.from(string);

    const boundary = 8;
    const byteLength = buffer.length;
    const remainder = (byteOffset + byteLength) % boundary;
    const padding = remainder === 0 ? 0 : boundary - remainder;
    const paddingBuffer = Buffer.from(" ".repeat(padding));
    return Buffer.concat([buffer, paddingBuffer]);
  }

  /**
   * Ensures that the given buffer ends at an 8-byte boundary,
   * padding it with zero-bytes at the end if necessary.
   *
   * If the buffer already ends at an 8-byte boundary, it is
   * returned directly. Otherwise, a new, padded buffer is
   * returned.
   *
   * @param json - The object
   * @param byteOffset - An optional offset where the buffer
   * is assumed to start, defaulting to 0
   * @return The buffer
   */
  static getBufferPadded(buffer: Buffer, byteOffset?: number): Buffer {
    byteOffset = byteOffset ?? 0;
    const boundary = 8;
    const byteLength = buffer.length;
    const remainder = (byteOffset + byteLength) % boundary;
    if (remainder === 0) {
      return buffer;
    }
    const padding = boundary - remainder;
    const paddingBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, paddingBuffer]);
  }
}
