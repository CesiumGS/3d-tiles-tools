import fs from "fs";
import crypto from "crypto";

import { TilesetError } from "../tilesetData/TilesetError";

import { IndexEntry } from "./IndexEntry";

// NOTE: These functions are carved out and ported to TypeScript from
// https://github.com/bjornblissing/3d-tiles-tools/blob/2f4844d5bdd704509bff65199898981228594aaa/validator/lib/archive.js
// TODO: The given implementation does not handle hash collisions!
// NOTE: Fixed an issue for ZIP64 inputs. See the part marked as "ZIP64_BUGFIX"

interface ZipLocalFileHeader {
  signature: number;
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
    let comp_size = buffer.readUInt32LE(20);
    const filename_size = buffer.readUInt16LE(28);
    const extra_size = buffer.readUInt16LE(30);
    const extrasStartOffset =
      ArchiveFunctions3tz.ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size;

    // ZIP64_BUGFIX: If this size is found, then the size is
    // stored in the extra field
    if (comp_size === 0xffffffff) {
      if (extra_size < 28) {
        throw new TilesetError("No zip64 extras buffer found");
      }
      // NOTE: The "ZIP64 header ID" might appear at a different position
      // in the extras buffer, but I don't see a sensible way to
      // differentiate between a 0x0001 appearing "randomly" as "some"
      // value in the extras, and the value actually indicating a ZIP64
      // header. So we look for it only at the start of the extras buffer:
      const extra_tag = buffer.readUInt16LE(extrasStartOffset + 0);
      if (
        extra_tag !== ArchiveFunctions3tz.ZIP64_EXTENDED_INFORMATION_EXTRA_SIG
      ) {
        throw new TilesetError("No zip64 extras signature found");
      }
      comp_size = Number(buffer.readBigUInt64LE(extrasStartOffset + 12));
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

    let offset = buffer.readUInt32LE(42);
    /*
    // if we get this offset, then the offset is stored in the 64 bit extra field
    if (offset === 0xffffffff) {
      let offset64Found = false;
      const endExtrasOffset =
        ArchiveFunctions3tz.ZIP_CENTRAL_DIRECTORY_STATIC_SIZE +
        filename_size +
        extra_size;
      let currentOffset =
        ArchiveFunctions3tz.ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size;
      while (!offset64Found && currentOffset < endExtrasOffset) {
        const extra_tag = buffer.readUInt16LE(currentOffset);
        const extra_size = buffer.readUInt16LE(currentOffset + 2);
        if (
          extra_tag ===
            ArchiveFunctions3tz.ZIP64_EXTENDED_INFORMATION_EXTRA_SIG &&
          extra_size == 8
        ) {
          offset = Number(buffer.readBigUInt64LE(currentOffset + 4));
          offset64Found = true;
        } else {
          currentOffset += extra_size;
        }
      }
      if (!offset64Found) {
        throw new TilesetError("No zip64 extended offset found");
      }
    }
    */
    // if we get this offset, then the offset is stored in the 64 bit extra field.
    // The size and signature of the buffer have already been checked when the
    // actual "comp_size" has been read.
    if (offset === 0xffffffff) {
      offset = Number(buffer.readBigUInt64LE(extrasStartOffset + 20));
    }

    const localFileDataSize =
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE +
      filename_size +
      +48 /* over-estimated local file header extra field size, to try and read all data in one go */ +
      comp_size;
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
    fs.readSync(fd, headerBuffer, 0, headerSize, Number(offset));
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
    fs.readSync(fd, headerBuffer, 0, headerSize, Number(offset));
    const filename_size = headerBuffer.readUInt16LE(26);
    const filename = headerBuffer.toString(
      "utf8",
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE,
      ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + filename_size
    );
    return filename;
  }

  static readEntryData(fd: number, zipIndex: IndexEntry[], path: string) {
    const normalizedPath = ArchiveFunctions3tz.normalizePath(path);
    const match = ArchiveFunctions3tz.searchIndex(zipIndex, normalizedPath);
    if (match) {
      const header = ArchiveFunctions3tz.readZipLocalFileHeader(
        fd,
        match.offset,
        path
      );
      const fileDataOffset =
        Number(match.offset) +
        ArchiveFunctions3tz.ZIP_LOCAL_FILE_HEADER_STATIC_SIZE +
        header.filename_size +
        header.extra_size;
      const fileContentsBuffer = Buffer.alloc(header.comp_size);
      //console.log(`Fetching data at offset ${fileDataOffset} size: ${header.comp_size}`);
      fs.readSync(fd, fileContentsBuffer, 0, header.comp_size, fileDataOffset);
      return fileContentsBuffer;
    }
    //console.log('No entry found for path ', path)
    return undefined;
  }
}
