/**
 * Options for starting the package server
 *
 * @internal
 */
export type PackageServerOptions = {
  /**
   * The host name
   */
  host: string;

  /**
   * The port
   */
  port: number;

  /**
   * The full name of the (root) tileset source that
   * should be served.
   */
  sourceName: string;
};
