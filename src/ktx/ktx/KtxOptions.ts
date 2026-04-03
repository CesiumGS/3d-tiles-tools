import { KtxEtc1sOptions } from "./KtxEtc1sOptions";
import { KtxUastcOptions } from "./KtxUastcOptions";

/**
 * A set of options for configuring KTX compression in the `KtxUtility`
 *
 * @internal
 */
export type KtxOptions = KtxEtc1sOptions &
  KtxUastcOptions & {
    /**
     * If true, a UASTC texture will be created. Otherwise a ETC1S texture
     * will be created. This also governs whether the `KtxUastcOptions`
     * or `KtxEtc1sOptions` will be applied to the encoder.
     */
    uastc: boolean;

    /**
     * Display output PSNR statistics
     */
    computeStats?: boolean;

    /**
     * Enables debug output to stdout
     */
    debug?: boolean;
  };
