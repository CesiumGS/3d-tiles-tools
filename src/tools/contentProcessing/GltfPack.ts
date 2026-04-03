import gltfpack from "gltfpack";

import { ContentError } from "./ContentError";
import { GltfPackOptions } from "./GltfPackOptions";

/**
 * Utility class for using gltfpack in the 3D Tiles tools
 *
 * @internal
 */
export class GltfPack {
  /**
   * Process the given input GLB data with gltfpack and the given
   * options, and return the result.
   *
   * @param inputGlb - The input GLB buffer
   * @param options - The options for gltfpack
   * @returns The processed buffer
   */
  static async process(inputGlb: Buffer, options: GltfPackOptions) {
    let outputGlb = inputGlb;

    // Create the "IO" interface that is passed to gltfpack
    // and that resolves the input- and output data
    // (The file extensions are required by gltfpack!)
    const inputName = "input.glb";
    const outputName = "output.glb";
    const io = {
      read: function (path: string): Uint8Array {
        if (path === inputName) {
          return inputGlb;
        }
        throw new ContentError(
          `The GLB data has an external reference to ${path}. ` +
            `External references are not supported.`
        );
      },
      write: function (path: string, data: Uint8Array): void {
        if (path === outputName) {
          outputGlb = Buffer.from(
            data.buffer.slice(
              data.byteOffset,
              data.byteLength + data.byteOffset
            )
          );
        } else {
          throw new ContentError(
            `gltfpack unexpectedly tried to write to ${path}. ` +
              `External references are not supported.`
          );
        }
      },
    };
    const args = GltfPack.createCommandLineArguments(options);
    args.push("-i");
    args.push(inputName);
    args.push("-o");
    args.push(outputName);
    await gltfpack.pack(args, io);
    return outputGlb;
  }

  /**
   * Translate the given options into gltfpack command line arguments
   * @param options - The gltfpack options
   * @returns The command line arguments
   */
  private static createCommandLineArguments(options: GltfPackOptions) {
    const args: string[] = [];
    if (options.c === true) {
      args.push("-c");
    }
    if (options.cc === true) {
      args.push("-cc");
    }
    if (options.si !== undefined) {
      args.push("-si");
      args.push(options.si.toString());
    }
    if (options.sa === true) {
      args.push("-sa");
    }
    if (options.slb === true) {
      args.push("-slb");
    }
    if (options.vp !== undefined) {
      args.push("-vp");
      args.push(options.vp.toString());
    }
    if (options.vt !== undefined) {
      args.push("-vt");
      args.push(options.vt.toString());
    }
    if (options.vn !== undefined) {
      args.push("-vn");
      args.push(options.vn.toString());
    }
    if (options.vc !== undefined) {
      args.push("-vc");
      args.push(options.vc.toString());
    }
    if (options.vpi === true) {
      args.push("-vpi");
    }
    if (options.vpn === true) {
      args.push("-vpn");
    }
    if (options.vpf === true) {
      args.push("-vpf");
    }
    if (options.at !== undefined) {
      args.push("-at");
      args.push(options.at.toString());
    }
    if (options.ar !== undefined) {
      args.push("-ar");
      args.push(options.ar.toString());
    }
    if (options.as !== undefined) {
      args.push("-as");
      args.push(options.as.toString());
    }
    if (options.af !== undefined) {
      args.push("-af");
      args.push(options.af.toString());
    }
    if (options.ac === true) {
      args.push("-ac");
    }
    if (options.kn === true) {
      args.push("-kn");
    }
    if (options.km === true) {
      args.push("-km");
    }
    if (options.ke === true) {
      args.push("-ke");
    }
    if (options.mm === true) {
      args.push("-mm");
    }
    if (options.mi === true) {
      args.push("-mi");
    }
    if (options.cf === true) {
      args.push("-cf");
    }
    if (options.noq === true) {
      args.push("-noq");
    }
    return args;
  }
}
