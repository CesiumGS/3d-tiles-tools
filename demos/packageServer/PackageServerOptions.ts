/**
 * Options for starting the package server
 */
export type PackageServerOptions = {
  /**
   * The host name
   */
  hostName: string;

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
