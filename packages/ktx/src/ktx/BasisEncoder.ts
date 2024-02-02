import { BASIS } from "./external/basis_encoder.cjs";

import { KtxError } from "./KtxError";

/**
 * A thin wrapper around the basis encoder. This class and its documentation are created from
 * https://github.com/BinomialLLC/basis_universal/blob/ad9386a4a1cf2a248f7bbd45f543a7448db15267/webgl/transcoder/basis_wrappers.cpp#L1702
 * with the additional hint: The user has to call 'delete()' to free the resources that
 * have been allocated by an instance, after the encoding is done. Attempting to call
 * any other method after 'delete()' was called will cause an error to be thrown.
 *
 * Compression/encoding object.
 *
 * You create this object, call the set() methods to fill in the parameters/source images/options, call encode(), and you get back a .basis or .KTX2 file.
 * You can call .encode() multiple times, changing the parameters/options in between calls.
 * By default this class encodes to .basis, but call setCreateKTX2File() with true to get .KTX2 files.
 *
 * @internal
 */
export class BasisEncoder {
  /**
   * The actual implementation object that was resolved from
   * the JS file of the WebAssembly module
   */
  private static BasisEncoderImpl: any = undefined;

  /**
   * Ensure that the implementation is initialized
   *
   * @returns A promise
   * @throws On error
   */
  private static async ensureBasisEncoderImplInitialized() {
    if (BasisEncoder.BasisEncoderImpl) {
      return;
    }
    // Ignore the warning "(node:8724) [DEP0005] DeprecationWarning:
    // Buffer() is deprecated due to security and usability issues."
    const originalEmitWarning = process.emitWarning;
    process.emitWarning = function (...args: any) {
      if (args[2] !== "DEP0005") {
        return originalEmitWarning.apply(process, args);
      } else {
        // Ignore
      }
    };
    const module = await BASIS();
    module.initializeBasis();
    BasisEncoder.BasisEncoderImpl = module.BasisEncoder;
  }

  /**
   * Creates a new instance of a basis encoder.
   *
   * @returns The encoder object
   * @throws If the object can not be instantiated
   */
  static async create(): Promise<BasisEncoder> {
    await this.ensureBasisEncoderImplInitialized();
    if (!BasisEncoder.BasisEncoderImpl) {
      throw new KtxError("Could not initialize BasisEncoder");
    }
    const implementation = new BasisEncoder.BasisEncoderImpl();
    return new BasisEncoder(implementation);
  }

  /**
   * The implementation object
   */
  private implementation: any;

  /**
   * Private constructor. Instances are created by calling
   * the `create` function.
   *
   * @param implementation - The implementation object
   */
  private constructor(implementation: any) {
    this.implementation = implementation;
  }

  /**
   * Private getter for the implementation object
   *
   * @throws KtxError If 'delete()' was already called.
   */
  private get impl(): NonNullable<any> {
    if (!this.implementation) {
      throw new KtxError(
        `The BasisEncoder was already deleted. ` +
          `Create a new instance for calling this method`
      );
    }
    return this.implementation;
  }

  /**
   * Delete all resources that have been allocated for this object.
   *
   * Attempting to call any method after 'delete()' has been called
   * will cause a KtxError to be thrown.
   */
  delete() {
    if (this.implementation) {
      this.impl.delete();
    }
    delete this.implementation;
  }

  /**
   * Compresses the provided source slice(s) to an output .basis file.
   * At the minimum, you must provided at least 1 source slice by calling setSliceSourceImage() before calling this method.
   *
   * @param dst_basis_file_js_val - The argument
   * @returns The result
   */
  encode(dst_basis_file_js_val: Uint8Array) {
    return this.impl.encode(dst_basis_file_js_val);
  }

  /**
   * Sets the slice's source image, either from a PNG file or from a raw 32-bit RGBA raster image.
   * If the input is a raster image, the buffer must be width*height*4 bytes in size.
   * The raster image is stored in top down scanline order.
   * The first texel is the top-left texel. The texel byte order in memory is R,G,B,A
   * (R first at offset 0, A last at offset 3).
   * slice_index is the slice to change. Valid range is [0,BASISU_MAX_SLICES-1].
   *
   * @param slice_index - The slice index
   * @param src_image_js_val - The input image data
   * @param width - The width
   * @param height - The height
   * @param src_image_is_png - Whether the input is PNG, for whatever reason...
   * @returns The result
   */
  setSliceSourceImage(
    slice_index: number,
    src_image_js_val: Uint8Array,
    width: number,
    height: number,
    src_image_is_png: boolean
  ) {
    return this.impl.setSliceSourceImage(
      slice_index,
      src_image_js_val,
      width,
      height,
      src_image_is_png
    );
  }

  /**
   * If true, the encoder will output a UASTC texture, otherwise a ETC1S texture.
   *
   * @param uastc_flag - The flag
   * @returns The result
   */
  setUASTC(uastc_flag: boolean) {
    return this.impl.setUASTC(uastc_flag);
  }

  /**
   * If true the source images will be Y flipped before compression.
   *
   * @param y_flip_flag - The flag
   * @returns The result
   */
  setYFlip(y_flip_flag: boolean) {
    return this.impl.setYFlip(y_flip_flag);
  }

  /**
   * Enables debug output to stdout
   *
   * @param debug_flag - The flag
   * @returns The result
   */
  setDebug(debug_flag: boolean) {
    return this.impl.setDebug(debug_flag);
  }

  /**
   * If true, the input is assumed to be in sRGB space. Be sure to set this correctly!
   * (Examples: True on photos, albedo/spec maps, and false on normal maps.)
   *
   * @param perceptual_flag - The flag
   * @returns The result
   */
  setPerceptual(perceptual_flag: boolean) {
    return this.impl.setPerceptual(perceptual_flag);
  }

  /**
   * Check source images for active/used alpha channels
   *
   * @param check_for_alpha_flag - The flag
   * @returns The result
   */
  setCheckForAlpha(check_for_alpha_flag: boolean) {
    return this.impl.setCheckForAlpha(check_for_alpha_flag);
  }

  /**
   * Fource output .basis file to have an alpha channel
   * @param force_alpha_flag - The flag
   * @returns The result
   */
  setForceAlpha(force_alpha_flag: boolean) {
    return this.impl.setForceAlpha(force_alpha_flag);
  }

  /**
   * Set source image component swizzle.
   * r,g,b,a - valid range is [0,3]
   *
   * @param r - Red
   * @param g - Green
   * @param b - Blue
   * @param a - Alpha
   * @returns The result
   */
  setSwizzle(r: number, g: number, b: number, a: number) {
    return this.impl.setSwizzle(r, g, b, a);
  }

  /**
   * If true, the input is assumed to be a normal map, and all source texels will be renormalized before encoding.
   *
   * @param renormalize_flag - The flag
   * @returns The result
   */
  setRenormalize(renormalize_flag: boolean) {
    return this.impl.setRenormalize(renormalize_flag);
  }

  /**
   * Sets the max # of endpoint clusters for ETC1S mode. Use instead of setQualityLevel.
   * Default is 512, range is [1,BASISU_MAX_ENDPOINT_CLUSTERS]
   *
   * @param max_endpoint_clusters - The value
   * @returns The result
   */
  setMaxEndpointClusters(max_endpoint_clusters: number) {
    return this.impl.setMaxEndpointClusters(max_endpoint_clusters);
  }

  /**
   * Sets the max # of selectors clusters for ETC1S mode. Use instead of setQualityLevel.
   * Default is 512, range is [1,BASISU_MAX_ENDPOINT_CLUSTERS]
   *
   * @param max_selector_clusters - The value
   * @returns The result
   */
  setMaxSelectorClusters(max_selector_clusters: number) {
    return this.impl.setMaxSelectorClusters(max_selector_clusters);
  }

  /**
   * Sets the ETC1S encoder's quality level, which controls the file size vs. quality tradeoff.
   * Default is -1 (meaning unused - the compressor will use m_max_endpoint_clusters/m_max_selector_clusters
   * instead to control the codebook sizes).
   * Range is [1,BASISU_QUALITY_MAX]
   *
   * @param quality_level - The value
   * @returns The result
   */
  setQualityLevel(quality_level: number) {
    return this.impl.setQualityLevel(quality_level);
  }

  /**
   * The compression_level parameter controls the encoder perf vs. file size tradeoff for ETC1S files.
   * It does not directly control file size vs. quality - see quality_level().
   * Default is BASISU_DEFAULT_COMPRESSION_LEVEL, range is [0,BASISU_MAX_COMPRESSION_LEVEL]
   *
   * @param comp_level - The value
   * @returns The result
   */
  setCompressionLevel(comp_level: number) {
    return this.impl.setCompressionLevel(comp_level);
  }

  /**
   * setNormalMapMode is the same as the basisu.exe "-normal_map" option.
   * It tunes several codec parameters so compression works better on normal maps.
   *
   * @returns The result
   */
  setNormalMap() {
    return this.impl.setNormalMap();
  }

  /**
   * Sets selector RDO threshold
   * Default is BASISU_DEFAULT_SELECTOR_RDO_THRESH, range is [0,1e+10]
   *
   * @param selector_rdo_thresh - The value
   * @returns The result
   */
  setSelectorRDOThresh(selector_rdo_thresh: number) {
    return this.impl.setSelectorRDOThresh(selector_rdo_thresh);
  }

  /**
   * Sets endpoint RDO threshold
   * Default is BASISU_DEFAULT_ENDPOINT_RDO_THRESH, range is [0,1e+10]
   *
   * @param endpoint_rdo_thresh - The value
   * @returns The result
   */
  setEndpointRDOThresh(endpoint_rdo_thresh: number) {
    return this.impl.setEndpointRDOThresh(endpoint_rdo_thresh);
  }

  /**
   * Create .KTX2 files instead of .basis files. By default this is FALSE.
   *
   * @param create_ktx2_file - The flag
   * @returns The result
   */
  setCreateKTX2File(create_ktx2_file: boolean) {
    return this.impl.setCreateKTX2File(create_ktx2_file);
  }

  /**
   * KTX2: Use UASTC Zstandard supercompression. Defaults to disabled or KTX2_SS_NONE.
   *
   * @param use_zstandard - The flag
   * @returns The result
   */
  setKTX2UASTCSupercompression(use_zstandard: boolean) {
    return this.impl.setKTX2UASTCSupercompression(use_zstandard);
  }

  /**
   * KTX2: Use sRGB transfer func in the file's DFD. Default is FALSE. This should very probably match the "perceptual" setting.
   *
   * @param srgb_transfer_func - The flag
   * @returns The result
   */
  setKTX2SRGBTransferFunc(srgb_transfer_func: boolean) {
    return this.impl.setKTX2SRGBTransferFunc(srgb_transfer_func);
  }

  /**
   * If true mipmaps will be generated from the source images
   *
   * @param mip_gen_flag - The flag
   * @returns The result
   */
  setMipGen(mip_gen_flag: boolean) {
    return this.impl.setMipGen(mip_gen_flag);
  }

  /**
   * Set mipmap filter's scale factor
   * default is 1, range is [.000125, 4.0]
   *
   * @param mip_scale - The value
   * @returns The result
   */
  setMipScale(mip_scale: number) {
    return this.impl.setMipScale(mip_scale);
  }

  /**
   * Sets the mipmap filter to apply
   * mip_filter must be less than BASISU_MAX_RESAMPLER_FILTERS
   * See the end of basisu_resample_filters.cpp: g_resample_filters[]
   *
   * @param mip_filter - The value
   * @returns The result
   */
  setMipFilter(mip_filter: number) {
    return this.impl.setMipFilter(mip_filter);
  }

  /**
   * If true mipmap filtering occurs in sRGB space - this generally should match the perceptual parameter.
   *
   * @param mip_srgb_flag - The flag
   * @returns The result
   */
  setMipSRGB(mip_srgb_flag: boolean) {
    return this.impl.setMipSRGB(mip_srgb_flag);
  }

  /**
   * If true, the input is assumed to be a normal map, and the texels of each mipmap will be renormalized before encoding.
   *
   * @param mip_renormalize_flag - The flag
   * @returns The result
   */
  setMipRenormalize(mip_renormalize_flag: boolean) {
    return this.impl.setMipRenormalize(mip_renormalize_flag);
  }

  /**
   * If true the source texture will be sampled using wrap addressing during mipmap generation, otherwise clamp.
   *
   * @param mip_wrapping_flag - The flag
   * @returns The result
   */
  setMipWrapping(mip_wrapping_flag: boolean) {
    return this.impl.setMipWrapping(mip_wrapping_flag);
  }

  /**
   * Sets the mipmap generator's smallest allowed dimension.
   * default is 1, range is [1,16384]
   *
   * @param mip_smallest_dimension - The value
   * @returns The result
   */
  setMipSmallestDimension(mip_smallest_dimension: number) {
    return this.impl.setMipSmallestDimension(mip_smallest_dimension);
  }

  /**
   * Sets the .basis texture type.
   * cBASISTexTypeVideoFrames changes the encoder into video mode.
   * tex_type is enum basis_texture_type
   * default is cBASISTexType2D
   *
   * @param tex_type - The value
   * @returns The result
   */
  setTexType(tex_type: number) {
    return this.impl.setTexType(tex_type);
  }

  /**
   * Sets the UASTC encoding performance vs. quality tradeoff, and other lesser used UASTC encoder flags.
   * This is a combination of flags. See cPackUASTCLevelDefault, etc.
   *
   * @param pack_uastc_flags - The value
   * @returns The result
   */
  setPackUASTCFlags(pack_uastc_flags: number) {
    return this.impl.setPackUASTCFlags(pack_uastc_flags);
  }

  /**
   * If true, the RDO post-processor will be applied to the encoded UASTC texture data.
   *
   * @param rdo_uastc - The flag
   * @returns The result
   */
  setRDOUASTC(rdo_uastc: boolean) {
    return this.impl.setRDOUASTC(rdo_uastc);
  }

  /**
   * Default is 1.0 range is [0.001, 10.0]
   *
   * @param rdo_quality - The value
   * @returns The result
   */
  setRDOUASTCQualityScalar(rdo_quality: number) {
    return this.impl.setRDOUASTCQualityScalar(rdo_quality);
  }

  /**
   * Default is BASISU_RDO_UASTC_DICT_SIZE_DEFAULT, range is [BASISU_RDO_UASTC_DICT_SIZE_MIN, BASISU_RDO_UASTC_DICT_SIZE_MAX]
   *
   * @param dict_size - THe value
   * @returns The result
   */
  setRDOUASTCDictSize(dict_size: number) {
    return this.impl.setRDOUASTCDictSize(dict_size);
  }

  /**
   * Default is UASTC_RDO_DEFAULT_MAX_ALLOWED_RMS_INCREASE_RATIO, range is [01, 100.0]
   *
   * @param rdo_uastc_max_allowed_rms_increase_ratio - The value
   * @returns The result
   */
  setRDOUASTCMaxAllowedRMSIncreaseRatio(
    rdo_uastc_max_allowed_rms_increase_ratio: number
  ) {
    return this.impl.setRDOUASTCMaxAllowedRMSIncreaseRatio(
      rdo_uastc_max_allowed_rms_increase_ratio
    );
  }

  /**
   * Default is UASTC_RDO_DEFAULT_SKIP_BLOCK_RMS_THRESH, range is [.01f, 100.0f]
   *
   * @param rdo_uastc_skip_block_rms_thresh - The value
   * @returns The result
   */
  setRDOUASTCSkipBlockRMSThresh(rdo_uastc_skip_block_rms_thresh: number) {
    return this.impl.setRDOUASTCSkipBlockRMSThresh(
      rdo_uastc_skip_block_rms_thresh
    );
  }

  /**
   * Disables selector RDO
   *
   * @param no_selector_rdo_flag - The flag
   * @returns The result
   */
  setNoSelectorRDO(no_selector_rdo_flag: boolean) {
    return this.impl.setNoSelectorRDO(no_selector_rdo_flag);
  }

  /**
   * Disables endpoint RDO
   *
   * @param no_endpoint_rdo_flag - The flag
   * @returns The result
   */
  setNoEndpointRDO(no_endpoint_rdo_flag: boolean) {
    return this.impl.setNoEndpointRDO(no_endpoint_rdo_flag);
  }

  /**
   * Display output PSNR statistics
   *
   * @param compute_stats_flag - The flag
   * @returns The result
   */
  setComputeStats(compute_stats_flag: boolean) {
    return this.impl.setComputeStats(compute_stats_flag);
  }
}
