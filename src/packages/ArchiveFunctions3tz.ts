import fs from "fs";
import crypto from "crypto";

import { TilesetError } from "../tilesetData/TilesetError";

import { IndexEntry } from "./IndexEntry";

// NOTE: These functions are carved out and ported to TypeScript from
// https://github.com/bjornblissing/3d-tiles-tools/blob/2f4844d5bdd704509bff65199898981228594aaa/validator/lib/archive.js
// TODO: The given implementation does not handle hash collisions!
// NOTE: Fixed several issues for ZIP64 and large ZIP files. Some of the
// changes are marked with "ZIP64_BUGFIX", but details have to be taken
// from the git change log.

/**
 * @internal
 */
export interface ZipLocalFileHeader {
  signature: number;
  compression_method: number;
  comp_size: number;
  filename_size: number;
  extra_size: number;
}

/**
 * @internal
 */
export class ArchiveFunctions3tz {
  private static readonly ZIP_END_OF_CENTRAL_DIRECTORY_HEADER_SIG = 0x06054b50;
  private static readonly ZIP_START_OF_CENTRAL_DIRECTORY_HEADER_SIG = 0x02014b50;
  private static readonly ZIP64_EXTENDED_INFORMATION_EXTRA_SIG = 0x0001;
  private static readonly ZIP_LOCAL_FILE_HEADER_STATIC_SIZE = 30;
  private static readonly ZIP_CENTRAL_DIRECTORY_STATIC_SIZE = 46;

  private static getLastCentralDirectoryEntry(
    fd: number,
    stat: { size: number }
  ) {
    const bytesToRead = 320;
    const buffer = Buffer.alloc(bytesToRead);
    const offset = stat.size - bytesToRead;
    const length = bytesToRead;
    fs.readSync(fd, buffer, 0, length, offset);

    let start = 0,
      end = 0;
    for (let i = buffer.length - 4; i > 0; i--) {
      const val = buffer.readUInt32LE(i);
      if (val === ArchiveFunctions3tz.ZIP_END_OF_CENTRAL_DIRECTORY_HEADER_SIG) {
        end = i;
      }
      if (
        val === ArchiveFunctions3tz.ZIP_START_OF_CENTRAL_DIRECTORY_HEADER_SIG
      ) {
        start = i;
        break;
      }
    }

    if (start !== end) {
      return buffer.subarray(start);
    }
    return undefined;
  }

  private static getFileContents(
    fd: number,
    buffer: Buffer,
    expectedFilename: string
  ) {
    const comp_size_from_record = buffer.readUInt32LE(20);
    let comp_size = BigInt(comp_size_from_record);
    const uncomp_size = buffer.readUInt32LE(24);
    const filename_size = buffer.readUInt16LE(28);
    const extra_size = buffer.readUInt16LE(30);
    const extrasStartOffset =
      ArchiveFunctions3tz.ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size;

    // ZIP64_BUGFIX: If this size is found, then the size is
    // stored in the extra field
    if (comp_size === 0xffffffffn) {
      if (extra_size < 28) {
        throw new TilesetError("No zip64 extras buffer found");
      }
      const extra_tag = buffer.readUInt16LE(extrasStartOffset + 0);
      if (
        extra_tag !== ArchiveFunctions3tz.ZIP64_EXTENDED_INFORMATION_EXTRA_SIG
      ) {
        throw new TilesetError("No zip64 extras signature found");
      }

      // According to the specification, the layout of the extras block is
      //
      // 0x0001                 2 bytes    Tag for this "extra" block type
      // Size                   2 bytes    Size of this "extra" block
      // Original Size          8 bytes    Original uncompressed file size
      // Compressed Size        8 bytes    Size of compressed data
      // Relative Header Offset 8 bytes    Offset of local header record
      // Disk Start Number      4 bytes    Number of the disk on which this file starts
      //
      // The order of the fields is fixed, but the fields MUST only appear
      // if the corresponding directory record field is set to 0xFFFF or
      // 0xFFFFFFFF.
      // So the offset for reading values from the "extras" depends on which
      // of the fields in the original record had the 0xFFFFFFFF value:
      let offsetInExtrasForCompSize = 4;
      if (uncomp_size === 0xffffffff) {
        offsetInExtrasForCompSize += 8;
      }
      comp_size = buffer.readBigUInt64LE(
        extrasStartOffset + offsetInExtrasForCompSize
      );
    }

    const filename = buffer.toString(
      "utf8",
      ArchiveFunctions3tz.ZIP_CENTRAL_DIRECTORY_STATIC_SIZE,
      ArchiveFunctions3tz.ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size
    );
    if (filename !== expectedFilename) {
      throw new TilesetError(
        `Central Directory File Header filename was ${filename}, expected ${expectedFilename}`
      );
    }
    let offset = BigInt(buffer.readUInt32LE(42));
    if (offset === 0xffffffffn) {
      // See notes about the layout of the extras block above:
      let offsetInExtrasForOffset = 4;
      if (uncomp_size === 0xffffffff) {
        offsetInExtrasForOffset += 8;
      }
      if (comp_size_from_record === 0xffffffff) {
        offsetInExtrasForOffset += 8;
      }
      offset = buffer.readBigUInt64LE(
        extrasStartOffset + offsetInExtrasForOffset
      );
    }

    const localFileDataSize =
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE +
      filename_size +
      +48 /* over-estimated local file header extra field size, to try and read all data in one go */ +
      Number(comp_size);
    const localFileDataBuffer = Buffer.alloc(localFileDataSize);

    fs.readSync(fd, localFileDataBuffer, 0, localFileDataSize, offset);

    // ok, skip past the filename and extras and we have our data
    const local_comp_size = localFileDataBuffer.readUInt32LE(18);
    const local_filename_size = localFileDataBuffer.readUInt16LE(26);
    const local_extra_size = localFileDataBuffer.readUInt16LE(28);
    const dataStartOffset =
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE +
      local_filename_size +
      local_extra_size;
    const fileDataBuffer = localFileDataBuffer.slice(
      dataStartOffset,
      dataStartOffset + local_comp_size
    );
    if (fileDataBuffer.length === 0) {
      throw new TilesetError(
        `Failed to get file data at offset ${dataStartOffset}`
      );
    }
    return fileDataBuffer;
  }

  private static parseIndexData(buffer: Buffer): IndexEntry[] {
    if (buffer.length % 24 !== 0) {
      throw new TilesetError(`Bad index buffer length: ${buffer.length}`);
    }
    const numEntries = buffer.length / 24;
    const index: IndexEntry[] = [];
    //console.log(`Zip index contains ${numEntries} entries.`);
    for (let i = 0; i < numEntries; i++) {
      const byteOffset = i * 24;
      const hash = buffer.slice(byteOffset, byteOffset + 16);
      const offset = buffer.readBigUInt64LE(byteOffset + 16);
      index.push({ hash: hash, offset: offset });
    }
    return index;
  }

  static md5LessThan(md5hashA: Buffer, md5hashB: Buffer) {
    const aLo = md5hashA.readBigUInt64LE();
    const bLo = md5hashB.readBigUInt64LE();
    if (aLo === bLo) {
      const aHi = md5hashA.readBigUInt64LE(8);
      const bHi = md5hashB.readBigUInt64LE(8);
      return aHi < bHi;
    }
    return aLo < bLo;
  }

  static zipIndexFind(zipIndex: IndexEntry[], searchHash: Buffer) {
    let low = 0;
    let high = zipIndex.length - 1;
    while (low <= high) {
      const mid = Math.floor(low + (high - low) / 2);
      const entry = zipIndex[mid];
      //console.log(`mid: ${mid} entry: ${entry.md5hash.toString('hex')}`);
      if (entry.hash.compare(searchHash) === 0) {
        return mid;
      } else if (
        ArchiveFunctions3tz.md5LessThan(zipIndex[mid].hash, searchHash)
      ) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return -1;
  }

  private static searchIndex(zipIndex: IndexEntry[], searchPath: string) {
    const hashedSearchPath = crypto
      .createHash("md5")
      .update(searchPath)
      .digest();
    //console.log(`Searching index for ${searchPath} (${hashedSearchPath.toString('hex')})`);

    //console.time('Search index');
    const matchedIndex = ArchiveFunctions3tz.zipIndexFind(
      zipIndex,
      hashedSearchPath
    );
    //console.log(`matchedIndex: ${matchedIndex}`);
    //console.timeEnd('Search index');
    if (matchedIndex === -1) {
      console.log(
        `Couldn't find ${searchPath} (${hashedSearchPath.toString("hex")})`
      );
      return undefined;
    }

    const entry = zipIndex[matchedIndex];
    //console.log(`Matched index: ${matchedIndex} - offset: ${entry.offset}`);
    return entry;
  }

  private static parseLocalFileHeader(
    buffer: Buffer,
    expectedFilename: string
  ): ZipLocalFileHeader {
    const signature = buffer.readUInt32LE(0);
    if (signature !== 0x04034b50) {
      throw new TilesetError(
        `Bad local file header signature: 0x${signature.toString(16)}`
      );
    }
    const compression_method = buffer.readUInt16LE(8);
    const comp_size = buffer.readUInt32LE(18);
    const filename_size = buffer.readUInt16LE(26);
    const extra_size = buffer.readUInt16LE(28);

    const filename = buffer.toString(
      "utf8",
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE,
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + filename_size
    );
    if (filename !== expectedFilename) {
      throw new TilesetError(
        `Local File Header filename was ${filename}, expected ${expectedFilename}`
      );
    }

    const compressedSize = comp_size;
    if (compressedSize === 0) {
      throw new TilesetError(
        "Zip Local File Headers must have non-zero file sizes set."
      );
    }
    return {
      signature: signature,
      compression_method: compression_method,
      comp_size: comp_size,
      filename_size: filename_size,
      extra_size: extra_size,
    };
  }

  static readZipLocalFileHeader(
    fd: number,
    offset: number | bigint,
    path: string
  ): ZipLocalFileHeader {
    const headerSize =
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + path.length;
    const headerBuffer = Buffer.alloc(headerSize);
    //console.log(`readZipLocalFileHeader path: ${path} headerSize: ${headerSize} offset: ${offset}`);
    fs.readSync(fd, headerBuffer, 0, headerSize, offset);
    //console.log(`headerBuffer: ${result.buffer}`);
    const header = ArchiveFunctions3tz.parseLocalFileHeader(headerBuffer, path);
    //console.log(header);
    return header;
  }

  private static normalizePath(path: string) {
    // on Windows, the paths get backslashes (due to path.join)
    // normalize that to be able to deal with internal zip paths
    const res = path.replace(/\.\//, "");
    return res.replace(/\\/g, "/");
  }

  static readZipIndex(fd: number): IndexEntry[] {
    const stat = fs.fstatSync(fd);
    const centralDirectoryEntryData =
      ArchiveFunctions3tz.getLastCentralDirectoryEntry(fd, stat);
    if (!centralDirectoryEntryData) {
      throw new TilesetError("Could not read last central directory entry");
    }
    const indexFileName = "@3dtilesIndex1@";
    const indexFileContents = ArchiveFunctions3tz.getFileContents(
      fd,
      centralDirectoryEntryData,
      indexFileName
    );
    const zipIndex = ArchiveFunctions3tz.parseIndexData(indexFileContents);
    return zipIndex;
  }

  static readFileName(fd: number, offset: number | bigint) {
    const headerSize =
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + 320;
    const headerBuffer = Buffer.alloc(headerSize);
    fs.readSync(fd, headerBuffer, 0, headerSize, offset);
    const filename_size = headerBuffer.readUInt16LE(26);
    const filename = headerBuffer.toString(
      "utf8",
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE,
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + filename_size
    );
    return filename;
  }

  static readEntry(
    fd: number,
    zipIndex: IndexEntry[],
    path: string
  ):
    | {
        compression_method: number;
        data: Buffer;
      }
    | undefined {
    const normalizedPath = ArchiveFunctions3tz.normalizePath(path);
    const match = ArchiveFunctions3tz.searchIndex(zipIndex, normalizedPath);
    if (match) {
      const header = ArchiveFunctions3tz.readZipLocalFileHeader(
        fd,
        match.offset,
        path
      );
      const fileDataOffset =
        match.offset +
        BigInt(ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE) +
        BigInt(header.filename_size) +
        BigInt(header.extra_size);
      const fileContentsBuffer = Buffer.alloc(header.comp_size);
      //console.log(`Fetching data at offset ${fileDataOffset} size: ${header.comp_size}`);
      fs.readSync(fd, fileContentsBuffer, 0, header.comp_size, fileDataOffset);

      return {
        compression_method: header.compression_method,
        data: fileContentsBuffer,
      };
    }
    //console.log('No entry found for path ', path)
    return undefined;
  }
}
