import zlib from "zlib";

import { defined } from "./defined";

import { DataError } from "./DataError";

/**
 * Methods related to buffers.
 *
 * The methods in this class are convenience methods that
 * are mainly used for handling buffers that contain tile
 * data.
 *
 * @internal
 */
export class Buffers {
  /**
   * Creates a buffer from a typed array
   *
   * @param array - The typed array
   * @returns The buffer
   */
  static fromTypedArray(
    array:
      | Int8Array
      | Uint8Array
      | Uint8ClampedArray
      | Int16Array
      | Uint16Array
      | Int32Array
      | Uint32Array
      | Float32Array
      | Float64Array
  ) {
    return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  }

  /**
   * Applies GZIP compression to the given buffer, and returns
   * the result.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static gzip(inputBuffer: Buffer): Buffer {
    const outputBuffer = zlib.gzipSync(inputBuffer);
    return outputBuffer;
  }

  /**
   * If the given buffer is compressed with GZIP, then it is
   * unzipped, and the result is returned. Otherwise, the
   * given buffer is returned as it is.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   * @throws DataError If the buffer looked like GZIPped
   * data, but could not be decompressed.
   */
  static gunzip(inputBuffer: Buffer): Buffer {
    let outputBuffer: Buffer;
    if (Buffers.isGzipped(inputBuffer)) {
      try {
        outputBuffer = zlib.gunzipSync(inputBuffer);
      } catch (e) {
        const message = `Could not gunzip buffer: ${e}`;
        throw new DataError(message);
      }
    } else {
      outputBuffer = inputBuffer;
    }
    return outputBuffer;
  }

  /**
   * Obtains the magic header bytes from the given buffer.
   *
   * This returns up to `byteLength` bytes of the given buffer,
   * starting at the given byte offset. If the buffer length
   * is too small, then a shorter buffer may be returned.
   *
   * @param buffer - The buffer
   * @param byteOffset - The byte offset, usually 0
   * @param byteLength - The byte length
   * @returns The magic header.
   */
  static getMagicBytes(
    buffer: Buffer,
    byteOffset: number,
    byteLength: number
  ): Buffer {
    const start = Math.min(buffer.length, byteOffset);
    const end = Math.min(buffer.length, start + byteLength);
    return buffer.subarray(start, end);
  }

  /**
   * Obtains the magic header from the given buffer, interpreted
   * as an ASCII string
   *
   * This returns up to 4 bytes of the given buffer, starting at
   * the given byte offset, converted to an ASCII string. If the
   * buffer length is too small, then a shorter string may be
   * returned.
   *
   * @param buffer - The buffer
   * @param byteOffset - The optional byte offset, defaulting to 0
   * @returns The magic header.
   */
  static getMagicString(buffer: Buffer, byteOffset?: number): string {
    const magicLength = 4;
    const start = Math.min(buffer.length, byteOffset ?? 0);
    const end = Math.min(buffer.length, start + magicLength);
    return buffer.toString("ascii", start, end);
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
   * If the given buffer is empty, then an empty object will
   * be returned.
   *
   * @param buffer - The buffer
   * @returns The parsed object
   * @throws DataError If the JSON could not be parsed
   */
  static getJson(buffer: Buffer): any {
    if (buffer.length === 0) {
      return {};
    }
    try {
      return JSON.parse(buffer.toString("utf8"));
    } catch (e) {
      const message = `Could not parse JSON from buffer: ${e}`;
      throw new DataError(message);
    }
  }

  /**
   * Creates a buffer that contains the JSON representation
   * of the given object, padding the end of the data with
   * spaces if necessary to make sure that the data ends
   * at an 8-byte boundary.
   *
   * @param json - The object
   * @param byteOffset - An optional offset where the buffer
   * is assumed to start, defaulting to 0
   * @returns The buffer
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
   * @returns The buffer
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

  /**
   * Returns a short string that describes the Unicode BOM (Byte Order Mask)
   * that the given buffer starts with, or `undefined` if the buffer does
   * not contain a BOM
   *
   * @param buffer - The buffer
   * @returns A short description of the BOM, or `undefined`
   * @internal
   */
  static getUnicodeBOMDescription(buffer: Buffer): string | undefined {
    if (Buffers.startsWith(buffer, [0xfe, 0xff])) {
      return "UTF-16 BE (FE FF)";
    }
    if (Buffers.startsWith(buffer, [0xff, 0xfe])) {
      return "UTF-16 LE (FF FE)";
    }
    if (Buffers.startsWith(buffer, [0xef, 0xbb, 0xbf])) {
      return "UTF-8 (EF BB BF)";
    }
    if (Buffers.startsWith(buffer, [0x00, 0x00, 0xfe, 0xbf])) {
      return "UTF-32 BE (00 00 FE FF)";
    }
    if (Buffers.startsWith(buffer, [0xff, 0xfe, 0x00, 0x00])) {
      return "UTF-32 LE (FF FE 00 00)";
    }
    return undefined;
  }

  /**
   * Returns whether the given buffer starts with the given sequence
   * of bytes.
   *
   * @param buffer - The buffer
   * @param bytes - The bytes
   * @returns Whether the buffer starts with the given bytes
   * @internal
   */
  private static startsWith(buffer: Buffer, bytes: number[]): boolean {
    if (buffer.length < bytes.length) {
      return false;
    }
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[i] != bytes[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates a string representation of the given buffer where each
   * byte is encoded in its binary form, consisting of 8 bits.
   *
   * Warning: This is primarily intended for debugging. The resulting
   * string may be very long...
   *
   * @param buffer - The input buffer
   * @returns The resulting string
   */
  static createBinaryString(buffer: Buffer): string {
    const s = [...buffer].map((b) => b.toString(2).padStart(8, "0")).join("");
    return s;
  }
}
