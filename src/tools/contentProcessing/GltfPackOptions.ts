/**
 * Options for gltfpack
 *
 * @internal
 */
export type GltfPackOptions = Partial<{
  /**
   * Produce compressed gltf/glb files (-cc for higher compression ratio)
   */
  c: boolean;
  /**
   * Produce compressed gltf/glb files (-cc for higher compression ratio)
   */
  cc: boolean;

  /**
   * Simplify meshes targeting triangle count ratio R (default: 1; R should be between 0 and 1)
   */
  si: number;

  /**
   * Aggressively simplify to the target ratio disregarding quality
   */
  sa: boolean;

  /**
   * Lock border vertices during simplification to avoid gaps on connected meshes
   */
  slb: boolean;

  /**
   * Use N-bit quantization for positions (default: 14; N should be between 1 and 16)
   */
  vp: number;

  /**
   * Use N-bit quantization for texture coordinates (default: 12; N should be between 1 and 16)
   */
  vt: number;

  /**
   * Use N-bit quantization for normals and tangents (default: 8; N should be between 1 and 16)
   */
  vn: number;

  /**
   * Use N-bit quantization for colors (default: 8; N should be between 1 and 16)
   */
  vc: number;

  /**
   * Use integer attributes for positions (default)
   */
  vpi: boolean;

  /**
   * Use normalized attributes for positions
   */
  vpn: boolean;

  /**
   * Use floating point attributes for positions
   */
  vpf: boolean;

  /**
   * Use N-bit quantization for translations (default: 16; N should be between 1 and 24)
   */
  at: number;

  /**
   * Use N-bit quantization for rotations (default: 12; N should be between 4 and 16)
   */
  ar: number;

  /**
   * Use N-bit quantization for scale (default: 16; N should be between 1 and 24)
   */
  as: number;

  /**
   * Resample animations at N Hz (default: 30)
   */
  af: number;

  /**
   * Keep constant animation tracks even if they don't modify the node transform
   */
  ac: boolean;

  /**
   * Keep named nodes and meshes attached to named nodes so that named nodes can be transformed externally
   */
  kn: boolean;

  /**
   * Keep named materials and disable named material merging
   */
  km: boolean;

  /**
   * Keep extras data
   */
  ke: boolean;

  /**
   * Merge instances of the same mesh together when possible
   */
  mm: boolean;

  /**
   * Use EXT_mesh_gpu_instancing when serializing multiple mesh instances
   */
  mi: boolean;

  /**
   * Produce compressed gltf/glb files with fallback for loaders that don't support compression
   */
  cf: boolean;

  /**
   * Disable quantization; produces much larger glTF files with no extensions
   */
  noq: boolean;
}>;
